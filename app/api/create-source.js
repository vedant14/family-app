import { verifyIdToken } from "~/utils/authHelpers";
import { findUserByEmail } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  try {
    const formData = await request.json();
    if (!formData || !formData.data) {
      return new Response(
        JSON.stringify({ error: "What is required is required!" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      sourceName,
      sourceType,
      label,
      subject,
      fromEmail,
      amountRegex,
      amountRegexBackup,
      payeeRegex,
      payeeRegexBackup,
      defaultCategory,
      defaultType,
      rulePriority = 1,
    } = formData.data;
    if (!sourceName || !defaultType || !rulePriority) {
      return new Response(
        JSON.stringify({ error: "What is required is required!" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const verifyUser = await verifyIdToken(formData.headers.Authorization);
    const user = await findUserByEmail(verifyUser.email);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    let queryParts = [];

    if (subject) {
      queryParts.push(`subject:${subject}`);
    }

    if (label) {
      queryParts.push(`label:${label}`);
    }
    if (fromEmail) {
      queryParts.push(`from:${fromEmail}`);
    }

    const query = queryParts.join(" ");
    

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const source = await prisma.source.create({
      data: {
        sourceName,
        query,
        sourceType,
        userId: user.id,
        amountRegex,
        amountRegexBackup,
        payeeRegex,
        payeeRegexBackup,
        defaultCategory,
        defaultType,
        rulePriority,
      },
    });

    return new Response(JSON.stringify(source), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return new Response(
      JSON.stringify({
        error: "Unexpected error occurred",
        details: error.response?.data || error.message,
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
