import axios from "axios";
import { getBody } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";

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

export const action = async ({ request }) => {
  let { sourceId, days } = await request.json();
  if (!days) {
    days = 2;
  }
  if (isNaN(sourceId)) {
    return new Response(JSON.stringify({ error: "Invalid sourceId format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const sourceObj = await prisma.source.findUnique({
    where: { id: Number(sourceId) },
    select: {
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
  if (!sourceObj || !sourceObj.user) {
    return new Response(
      JSON.stringify({
        error: "Source or user not found",
        sourceObj,
        sourceId,
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
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
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ message: `No emails found for query: ${query}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
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
      return { message: "All emails already processed.", sourceId, messages };
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
          await prisma.ledger.create({
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

          return { id: message.id };
        } catch (emailError) {
          console.error(
            `❌ Error processing email ${message.id}:`,
            emailError.response?.data || emailError.message
          );
          return null;
        }
      })
    );

    return new Response(JSON.stringify(emails.filter(Boolean)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`🔄 Token expired. Fetching new token...`);
      accessToken = await refreshAccessToken(
        sourceObj.user.id,
        sourceObj.user.email
      );
    } else {
      throw error;
    }
  }

  return new Response(JSON.stringify({ sourceObj }), {
    headers: { "Content-Type": "application/json" },
  });
};
