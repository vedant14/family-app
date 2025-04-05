import { extractInfoFromEmail } from "~/utils/helperFunctions";
import prisma from "~/utils/prismaClient";

export const action = async ({ request }) => {
  const { ledgerId } = await request.json();
  let jobs = [];
  if (ledgerId) {
    jobs = await prisma.ledger.findMany({
      where: { id: Number(ledgerId) },
      select: {
        id: true,
        body: true,
        source: {
          select: {
            amountRegex: true,
            amountRegexBackup: true,
            payeeRegex: true,
            payeeRegexBackup: true,
          },
        },
      },
    });
  } else {
    jobs = await prisma.ledger.findMany({
      where: { status: "CREATED" },
      select: {
        id: true,
        body: true,
        source: {
          select: {
            amountRegex: true,
            amountRegexBackup: true,
            payeeRegex: true,
            payeeRegexBackup: true,
          },
        },
      },
    });
  }
  let results = [];
  for (const job of jobs) {
    try {
      const data = extractInfoFromEmail(
        job.body,
        job.source.amountRegex,
        job.source.amountRegexBackup,
        job.source.payeeRegex,
        job.source.payeeRegexBackup
      );
      if (data.amount) {
        const amountFloat = parseFloat(data.amount.replace(/,/g, ""));
        await prisma.ledger.update({
          where: { id: job.id },
          data: {
            status: "EXTRACTED",
            amountExtract: parseFloat(amountFloat),
            payeeExtract: data.payee,
          },
        });
      }
      results.push(`Job ${job.id} completed.`);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
    }
  }
  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

