import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function extractAmountJobs() {
  console.log("Worker started");
  const jobs = await prisma.ledger.findMany({
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
  for (const job of jobs) {
    console.log(`Processing job ${job.id}...`);
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
      console.log(`Job ${job.id} completed.`);
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
    }
  }
  console.log("Worker finished.");
}

const cleanRegex = (regex) => {
  return typeof regex === "string"
    ? regex.replace(/^\/|\/$/g, "")
    : regex.toString().replace(/^\/|\/$/g, "");
};

const extractInfoFromEmail = (
  emailData,
  amount_regex,
  amount_regex_backup,
  payee_regex,
  payee_regex_backup
) => {
  const data = {};
  const cleanedAmountRegex = cleanRegex(amount_regex);
  const cleanedAmountRegexBackup = cleanRegex(amount_regex_backup);
  const cleanedPayeeRegex = cleanRegex(payee_regex);
  const cleanedPayeeRegexBackup = cleanRegex(payee_regex_backup);
  const primaryAmountMatch = emailData.match(new RegExp(cleanedAmountRegex));
  if (primaryAmountMatch) {
    data.amount = primaryAmountMatch[1]
      ? primaryAmountMatch[1]
      : primaryAmountMatch[0];
  } else {
    const backupAmountMatch = emailData.match(
      new RegExp(cleanedAmountRegexBackup)
    );
    data.amount = backupAmountMatch ? backupAmountMatch[0] : null;
  }

  const primaryPayeeMatch = emailData.match(new RegExp(cleanedPayeeRegex));
  if (primaryPayeeMatch) {
    data.payee = primaryPayeeMatch[0];
  } else {
    const backupPayeeMatch = emailData.match(
      new RegExp(cleanedPayeeRegexBackup)
    );
    data.payee = backupPayeeMatch ? backupPayeeMatch[0] : null;
  }
  return data;
};

extractAmountJobs();
