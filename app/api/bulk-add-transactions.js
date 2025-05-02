import prisma from "~/utils/prismaClient";

function parseMMDDYYYY(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[0], 10);
  const year = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
  if (year < 1900 || year > 2100) return null;

  const date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues
  if (
    isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null; // Invalid date formed (e.g., Feb 30)
  }

  return date;
}

const parseCsvData = (csvString) => {
  if (!csvString || typeof csvString !== "string") {
    throw new Error("Invalid or empty CSV content provided.");
  }
  const lines = csvString.trim().split("\n");
  if (lines.length < 2) {
    if (
      lines.length === 1 &&
      lines[0].trim() === "date,sourceId,amount,payee,tags"
    ) {
      return { parsedTransactions: [], parsingErrors: [] };
    }
    throw new Error("CSV content is empty or missing data rows.");
  }
  const headerLine = lines[0].trim();
  const expectedHeaders = ["date", "sourceId", "amount", "payee", "tags"];
  const headers = headerLine.split(",").map((h) => h.trim());
  if (
    headers.length !== expectedHeaders.length ||
    !headers.every((h, i) => h === expectedHeaders[i])
  ) {
    throw new Error(
      `Invalid CSV header. Expected: "${expectedHeaders.join(
        ","
      )}", Got: "${headerLine}"`
    );
  }
  const data = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",");
    if (values.length !== headers.length) {
      errors.push(
        `Row ${i + 1}: Incorrect column count. Expected ${
          headers.length
        }, got ${values.length}. Line: "${line}"`
      );
      continue;
    }
    try {
      const sourceId = parseInt(values[1].trim(), 10);
      const amount = parseFloat(values[2].trim());
      if (isNaN(sourceId) || isNaN(amount)) {
        throw new Error(`Invalid number format for sourceId or amount.`);
      }
      const transaction = {
        date: values[0].trim(),
        sourceId: sourceId,
        amount: amount,
        payee: values[3].trim(),
      };
      data.push(transaction);
    } catch (rowError) {
      errors.push(`Row ${i + 1}: ${rowError.message} Line: "${line}"`);
    }
  }
  return { parsedTransactions: data, parsingErrors: errors };
};

export const action = async ({ request }) => {
  const requestId = crypto.randomUUID();
  const headers = request.headers;
  const contentType = headers.get("content-type");

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Invalid request method. Use POST.",
        ok: false,
        requestId,
      }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  let csvString;
  try {
    csvString = await request.text();
    if (!csvString || csvString.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Request body is empty.",
          ok: false,
          requestId,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error(`[Action ${requestId}] Error reading request body:`, error);
    return new Response(
      JSON.stringify({
        error: `Failed to read request body: ${error.message}`,
        ok: false,
        requestId,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsedResult;
  let dataForCreateMany = [];
  let sourceIdToUserIdMap = new Map();

  try {
    parsedResult = parseCsvData(csvString);
    const { parsedTransactions, parsingErrors } = parsedResult;

    if (parsedTransactions.length === 0 && parsingErrors.length > 0) {
      throw new Error(
        `CSV parsing failed with errors: ${parsingErrors.join("; ")}`
      );
    }
    if (parsedTransactions.length === 0) {
      return new Response(
        JSON.stringify({
          message: "CSV processed, but no valid transactions found to create.",
          ok: true,
          parsingErrors,
          requestId,
          transactionsCreated: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const uniqueSourceIds = [
      ...new Set(parsedTransactions.map((tx) => tx.sourceId)),
    ];

    if (uniqueSourceIds.length > 0) {
      const sources = await prisma.source.findMany({
        where: {
          id: { in: uniqueSourceIds },
        },
        select: {
          id: true,
          userId: true,
        },
      });

      sources.forEach((source) => {
        sourceIdToUserIdMap.set(source.id, source.userId);
      });
    }

    const dataProcessingErrors = [...parsingErrors]; // Combine parsing and processing errors

    for (const transaction of parsedTransactions) {
      const userId = sourceIdToUserIdMap.get(transaction.sourceId);
      if (userId === undefined) {
        dataProcessingErrors.push(
          `Transaction skipped: Source ID ${transaction.sourceId} not found or has no associated User ID.`
        );
        continue;
      }

      const dateObject = parseMMDDYYYY(transaction.date);
      if (!dateObject) {
        dataProcessingErrors.push(
          `Transaction skipped: Invalid date format for '${transaction.date}'. Use MM/DD/YYYY.`
        );
        continue;
      }

      dataForCreateMany.push({
        date: dateObject,
        userId: userId,
        sourceId: transaction.sourceId,
        amountExtract: transaction.amount,
        payeeExtract: transaction.payee,
      });
    }

    if (dataForCreateMany.length === 0) {
      return new Response(
        JSON.stringify({
          message:
            "Transactions parsed, but none could be prepared for creation due to errors (missing sources, invalid dates, etc.).",
          ok: false,
          processingErrors: dataProcessingErrors,
          requestId,
          transactionsCreated: 0,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const createResult = await prisma.ledger.createMany({
      data: dataForCreateMany,
    });

    return new Response(
      JSON.stringify({
        message: `Successfully created ${createResult.count} ledger entries.`,
        transactionsCreated: createResult,
        transactionsSkipped: parsedTransactions.length - createResult.count,
        processingWarnings: dataProcessingErrors,
        requestId,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } } // 201 Created is appropriate
    );
  } catch (error) {
    console.error(
      `[Action ${requestId}] Error processing data or creating ledger entries:`,
      error
    );
    return new Response(
      JSON.stringify({
        error: `Processing failed: ${error.message}`,
        ok: false,
        requestId,
      }),
      {
        status:
          error.code === "P2002" ||
          error instanceof Prisma.PrismaClientKnownRequestError
            ? 409
            : 500,
        headers: { "Content-Type": "application/json" },
      } // Use 409 Conflict for unique constraint errors, 500 otherwise
    );
  }
};
