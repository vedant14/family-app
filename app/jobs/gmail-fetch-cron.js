// gmail-fetch-cron.js
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { htmlToText } from "html-to-text";

// Environment variables validation
const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  console.error("❌ BASE_URL environment variable is not set");
  process.exit(1);
}

// Configuration
const CONFIG = {
  daysToFetch: process.env.DAYS_TO_FETCH
    ? parseInt(process.env.DAYS_TO_FETCH)
    : 2,
  maxRetries: process.env.MAX_RETRIES ? parseInt(process.env.MAX_RETRIES) : 3,
  retryDelay: process.env.RETRY_DELAY
    ? parseInt(process.env.RETRY_DELAY)
    : 1000,
};

const prisma = new PrismaClient();
export function getBody(emailData) {
  let body = "";
  if (emailData.payload.body?.data) {
    body = Buffer.from(emailData.payload.body.data, "base64").toString("utf-8");
    return body;
  }

  if (emailData.payload.parts) {
    const textPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/plain"
    );

    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
      return body;
    }

    // Fallback: Try to find HTML part and convert to plain text
    const htmlPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/html"
    );
    if (htmlPart?.body?.data) {
      const html = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      body = htmlToText(html, {
        wordwrap: false,
        selectors: [
          { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
        ],
      });
      return body;
    }
  }

  // If nothing found
  return "";
}

async function refreshAccessToken(userId, email) {
  console.log(`🔄 Fetching new access token for ${email}...`);
  try {
    const response = await axios.post(`${BASE_URL}/api/fetch-token`, { email });

    if (response.status !== 200 || !response.data.user.accessToken) {
      throw new Error("❌ Failed to refresh access token");
    }

    return response.data.user.accessToken;
  } catch (error) {
    console.error("❌ Error refreshing token:", error.message);
    throw new Error(`Failed to refresh token for ${email}: ${error.message}`);
  }
}

async function fetchWithRetry(url, token, retries = 0) {
  try {
    return await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    if (error.response?.status === 401 || retries >= CONFIG.maxRetries) {
      throw error; // Let the calling function handle 401 or max retries reached
    }

    console.log(`Retrying (${retries + 1}/${CONFIG.maxRetries})...`);
    await new Promise((resolve) => setTimeout(resolve, CONFIG.retryDelay));
    return fetchWithRetry(url, token, retries + 1);
  }
}

async function processSource(sourceObj, initialToken = null, retryCount = 0) {
  const sourceId = sourceObj.id;
  const sourceName = sourceObj.sourceName;
  // Input validation
  if (!sourceObj || !sourceObj.user) {
    console.error("Source or user not found", { sourceId });
    return { error: "Source or user not found", sourceId };
  }

  // If we've reached max retries, stop retrying
  if (retryCount >= CONFIG.maxRetries) {
    console.error(
      `Max retries reached for source ${sourceName} (ID: ${sourceId})`
    );
    return { error: "Max retries reached", sourceId };
  }

  console.log(`Processing source: ${sourceName} (ID: ${sourceId})`);
  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - CONFIG.daysToFetch);
  const afterDate = pastDate.toISOString().split("T")[0].replace(/-/g, "/");
  let queryParts = sourceObj.query ? [`${sourceObj.query}`] : [];
  queryParts.push(`after:${afterDate}`);
  const query = queryParts.join(" ");
  let accessToken = initialToken || sourceObj.user.user.accessToken;

  try {
    const listResponse = await fetchWithRetry(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query
      )}`,
      accessToken
    );

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log(`No emails found for query: ${query}`);
      return { message: `No emails found for query: ${query}`, sourceId };
    }

    // Fetch existing email IDs to avoid duplicates
    const emailIds = messages.map((m) => m.id);
    const existingEmails = await prisma.ledger.findMany({
      where: { emailId: { in: emailIds } },
      select: { emailId: true },
    });
    const existingEmailIds = new Set(existingEmails.map((e) => e.emailId));

    // Process only new emails
    const newMessages = messages.filter((m) => !existingEmailIds.has(m.id));

    if (newMessages.length === 0) {
      console.log(`All emails already processed for source: ${sourceId}`);
      return { message: "All emails already processed.", sourceId };
    }

    console.log(
      `Processing ${newMessages.length} new emails for source: ${sourceId}`
    );

    // Process emails within a transaction
    const processedEmails = await prisma
      .$transaction(async (tx) => {
        const results = [];

        for (const message of newMessages) {
          try {
            const messageResponse = await fetchWithRetry(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
              accessToken
            );

            const emailData = messageResponse.data;
            const headers = emailData.payload.headers || [];
            const subject =
              headers.find((header) => header.name === "Subject")?.value ||
              "No Subject";
            const emailDate =
              headers.find((header) => header.name === "Date")?.value || "";
            const receivedDate = new Date(emailDate);
            const body = getBody(emailData);

            // Upsert into database within transaction
            const result = await tx.ledger.create({
              data: {
                date: receivedDate,
                userId: sourceObj.user.id,
                emailSubject: subject,
                body,
                categoryId: sourceObj.defaultCategory?.id,
                transactionTypeExtract: sourceObj.defaultType,
                emailId: message.id,
                sourceId: Number(sourceId),
              },
            });
            console.log(`Processed email: ${message.id} (${subject})`);
            results.push({ id: message.id, sourceName, subject });
          } catch (emailError) {
            console.error(
              `❌ Error processing email ${message.id}:`,
              emailError.message
            );
            throw emailError; // Rollback transaction on error
          }
        }
        return results;
      })
      .catch(async (txError) => {
        if (txError.response?.status === 401) {
          console.log(
            `🔄 Token expired during transaction. Fetching new token...`
          );
          try {
            const newToken = await refreshAccessToken(
              sourceObj.user.user.id,
              sourceObj.user.user.email
            );
            // Retry with new token and increment retry count
            return processSource(sourceObj, newToken, retryCount + 1);
          } catch (refreshError) {
            console.error(
              `Failed to refresh token for source ${sourceId}:`,
              refreshError.message
            );
            return { error: "Failed to refresh token", sourceId };
          }
        }

        // Other transaction errors
        console.error(
          `Transaction error for source ${sourceId}:`,
          txError.message
        );
        return { error: txError.message, sourceId };
      });

    if (Array.isArray(processedEmails)) {
      console.log(
        `Successfully processed ${processedEmails.length} emails for source: ${sourceId}`
      );
    }

    return {
      sourceId,
      sourceName,
      result: processedEmails,
    };
  } catch (error) {
    // Handle token expiration
    if (error.response?.status === 401) {
      console.log(`🔄 Token expired. Fetching new token...`);
      try {
        const newToken = await refreshAccessToken(
          sourceObj.user.user.id,
          sourceObj.user.user.email
        );
        // Retry with new token and increment retry count
        return processSource(sourceObj, newToken, retryCount + 1);
      } catch (refreshError) {
        console.error(
          `Failed to refresh token for source ${sourceId}:`,
          refreshError.message
        );
        return { error: "Failed to refresh token", sourceId };
      }
    }

    // Other errors
    console.error(`Error processing source ${sourceId}:`, error.message);
    return { error: error.message, sourceId };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("Starting Gmail fetch cron job...");

  try {
    const sources = await prisma.source.findMany({
      where: {
        status: "ACTIVE",
        sourceType: "MAIL",
      },
      select: {
        id: true,
        sourceName: true,
        query: true,
        defaultCategory: {
          select: {
            id: true,
          },
        },
        defaultType: true,
        user: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                accessToken: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${sources.length} active mail sources`);

    if (sources.length === 0) {
      console.log("No active mail sources found. Exiting.");
      return;
    }

    // Process each source sequentially to avoid rate limiting
    const results = [];
    for (const source of sources) {
      const result = await processSource(source);
      results.push(result);
    }
    console.log(
      "Results summary:",
      results.map((r) => ({
        sourceId: r.sourceId,
        status: Array.isArray(r.result) ? "success" : "error",
        count: Array.isArray(r.result) ? r.result.length : 0,
      }))
    );
  } catch (error) {
    console.error("❌ Error in cron job:", error.message);
  } finally {
    // Always close Prisma client connection properly
    await prisma.$disconnect();
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error in cron job:", error);
  // Ensure Prisma connection is closed on fatal error
  prisma.$disconnect().then(() => {
    process.exit(1);
  });
});
