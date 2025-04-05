import { extractInfoFromEmail } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";

export const action = async ({ params, request }) => {
  const sourceId = Number(params.sourceId);
  if (isNaN(sourceId)) {
    return new Response(JSON.stringify({ error: "Invalid sourceId format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const sourceObj = await prisma.source.findUnique({
    where: { id: sourceId },
    select: {
      amountRegex: true,
      amountRegexBackup: true,
      payeeRegex: true,
      payeeRegexBackup: true,
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
  const { text } = await request.json();
  const data = extractInfoFromEmail(
    text,
    sourceObj.amountRegex,
    sourceObj.amountRegexBackup,
    sourceObj.payeeRegex,
    sourceObj.payeeRegexBackup
  );
    await prisma.ledger.create({
      data: {
        date: new Date(),
        userId: sourceObj.user.id,
        body: text,
        amountExtract: parseFloat(data.amount),
        payeeExtract: data.payee,
        status: "EXTRACTED",
        categoryId: sourceObj.defaultCategory?.id,
        transactionTypeExtract: sourceObj.defaultType,
        sourceId: sourceId,
      },
    });

  return new Response(JSON.stringify({ results: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
