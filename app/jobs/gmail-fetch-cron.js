// gmail-fetch-cron.js
import axios from "axios";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

function getBody(emailData) {
  let body = "";
  if (emailData.payload.body?.data) {
    body = Buffer.from(emailData.payload.body.data, "base64").toString("utf-8");
  } else if (emailData.payload.parts) {
    const textPart = emailData.payload.parts.find(
      (part) => part.mimeType === "text/plain"
    );
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
    } else {
      const htmlPart = emailData.payload.parts.find(
        (part) => part.mimeType === "text/html"
      );
      if (htmlPart?.body?.data) {
        body = Buffer.from(htmlPart.body.data, "base64").toString("utf-8");
      }
    }
  }
  return body;
}

async function refreshAccessToken(userId, email) {
  console.log(`🔄 Fetching new access token for ${email}...`);
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/fetch-token`,
      {
        email,
      }
    );
    if (response.status !== 200 || !response.data.accessToken) {
      throw new Error("❌ Failed to refresh access token");
    }
    await prisma.user.update({
      where: { id: userId },
      data: { accessToken: response.data.accessToken },
    });

    return response.data.accessToken;
  } catch (error) {
    console.error("❌ Error refreshing token:", error);
    throw error;
  }
}

async function processSource(sourceObj) {
  const days = 2;
  const sourceId = sourceObj.id;

  console.log(`Processing source: ${sourceObj.sourceName} (ID: ${sourceId})`);

  if (!sourceObj || !sourceObj.user) {
    console.error("Source or user not found", { sourceId });
    return { error: "Source or user not found", sourceId };
  }

  const today = new Date();
  const pastDate = new Date(today);
  pastDate.setDate(today.getDate() - days);
  const afterDate = pastDate.toISOString().split("T")[0].replace(/-/g, "/");

  let queryParts = sourceObj.query ? [`${sourceObj.query}`] : [];
  queryParts.push(`after:${afterDate}`);
  const query = queryParts.join(" ");
  let accessToken = sourceObj.user.user.accessToken;

  try {
    const listResponse = await axios.get(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        query
      )}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log(`No emails found for query: ${query}`);
      return { message: `No emails found for query: ${query}` };
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
      return { message: "All emails already processed." };
    }

    console.log(
      `Processing ${newMessages.length} new emails for source: ${sourceId}`
    );

    const emails = await Promise.all(
      newMessages.map(async (message) => {
        try {
          const messageResponse = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
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

          // Upsert into database
          await prisma.ledger.upsert({
            where: { emailId: message.id },
            update: {
              date: receivedDate,
              userId: sourceObj.user.id,
              emailSubject: subject,
              body,
              categoryId: sourceObj.defaultCategory?.id,
              transactionTypeExtract: sourceObj.defaultType,
              sourceId: sourceId,
            },
            create: {
              date: receivedDate,
              userId: sourceObj.user.id,
              emailSubject: subject,
              body,
              categoryId: sourceObj.defaultCategory?.id,
              transactionTypeExtract: sourceObj.defaultType,
              emailId: message.id,
              sourceId: sourceId,
            },
          });

          console.log(`Processed email: ${message.id} (${subject})`);
          return { id: message.id, subject };
        } catch (emailError) {
          if (emailError.response?.status === 401) {
            console.log(`🔄 Token expired. Fetching new token...`);
            accessToken = await refreshAccessToken(
              sourceObj.user.user.id,
              sourceObj.user.user.email
            );
            // Retry with new token
            return processSource(sourceObj);
          }

          console.error(
            `❌ Error processing email ${message.id}:`,
            emailError.response?.data || emailError.message
          );
          return null;
        }
      })
    );

    const processedEmails = emails.filter(Boolean);
    console.log(
      `Successfully processed ${processedEmails.length} emails for source: ${sourceId}`
    );
    return processedEmails;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`🔄 Token expired. Fetching new token...`);
      try {
        accessToken = await refreshAccessToken(
          sourceObj.user.user.id,
          sourceObj.user.user.email
        );
        // Retry with new token
        return processSource(sourceObj);
      } catch (refreshError) {
        console.error(
          `Failed to refresh token for source ${sourceId}:`,
          refreshError
        );
        return { error: "Failed to refresh token", sourceId };
      }
    } else {
      console.error(`Error processing source ${sourceId}:`, error.message);
      return { error: error.message, sourceId };
    }
  }
}

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
      results.push({
        sourceId: source.id,
        sourceName: source.sourceName,
        result,
      });
    }

    console.log("Gmail fetch cron job completed successfully");
    console.log("Results:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("❌ Error in cron job:", error);
  } finally {
    // Close Prisma client connection
    await prisma.$disconnect();
  }
}

// Run the main function
main().catch((error) => {
  console.error("Fatal error in cron job:", error);
  process.exit(1);
});
