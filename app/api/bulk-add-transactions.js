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
        tags: values[4].trim(),
      };
      data.push(transaction);
    } catch (rowError) {
      errors.push(`Row ${i + 1}: ${rowError.message} Line: "${line}"`);
    }
  }
  return { parsedTransactions: data, parsingErrors: errors };
};

export const action = async ({ request, params }) => {
  const requestId = crypto.randomUUID();
  const teamIdParam = params?.teamId;
  const teamId = teamIdParam ? Number(teamIdParam) : NaN;

  if (isNaN(teamId)) {
    // ... (handle invalid teamId) ...
    return new Response(
      JSON.stringify({
        error: "Invalid or missing teamId in URL path.",
        ok: false,
        requestId,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (request.method !== "POST") {
    // ... (handle invalid method) ...
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
      // ... (handle empty body) ...
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
    // ... (handle body read error) ...
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
  let sourceIdToUserIdMap = new Map();
  // Store data needed for ledger creation separately
  let ledgerDataForCreation = [];
  // Store tagIds corresponding to each ledger entry (parallel array)
  let tagsForLedgers = [];
  let dataProcessingErrors = [];
  let skippedCount = 0;

  try {
    parsedResult = parseCsvData(csvString);
    dataProcessingErrors.push(...parsedResult.parsingErrors);
    const { parsedTransactions } = parsedResult;

    if (parsedTransactions.length === 0) {
      // ... (handle no transactions found) ...
      return new Response(
        JSON.stringify({
          message: "CSV processed, but no valid transactions found to create.",
          ok: true,
          parsingErrors: dataProcessingErrors,
          requestId,
          transactionsCreated: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const uniqueSourceIds = [
      ...new Set(parsedTransactions.map((tx) => tx.sourceId)),
    ];

    // Pre-fetch UserIDs
    if (uniqueSourceIds.length > 0) {
      // ... (fetch sources and populate sourceIdToUserIdMap as before) ...
      const sources = await prisma.source.findMany({
        where: { id: { in: uniqueSourceIds }, user: { teamId: teamId } },
        select: { id: true, userId: true },
      });
      sources.forEach((source) => {
        sourceIdToUserIdMap.set(source.id, source.userId);
      });
    }

    // --- Step 1: Prepare Ledger Data and Upsert Tags (Collect IDs) ---
    for (const transaction of parsedTransactions) {
      const userId = sourceIdToUserIdMap.get(transaction.sourceId);
      if (userId === undefined) {
        dataProcessingErrors.push(
          `Transaction skipped: Source ID ${transaction.sourceId} not found or does not belong to Team ${teamId}.`
        );
        skippedCount++;
        continue;
      }
      const dateObject = parseMMDDYYYY(transaction.date);
      if (!dateObject) {
        dataProcessingErrors.push(
          `Transaction skipped: Invalid date format for '${transaction.date}'. Use MM/DD/YYYY.`
        );
        skippedCount++;
        continue;
      }

      // Upsert tags and collect IDs
      const tagNames = transaction.tags
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean);
      const currentTagIds = [];
      if (tagNames.length > 0) {
        for (const tagName of tagNames) {
          const tagRecord = await prisma.tag.upsert({
            where: { teamId_tag: { teamId: teamId, tag: tagName } }, // Use correct composite key syntax
            create: { tag: tagName, teamId: teamId },
            update: {},
            select: { id: true },
          });
          currentTagIds.push(tagRecord.id);
        }
      }
      ledgerDataForCreation.push({
        date: dateObject,
        userId: userId,
        sourceId: transaction.sourceId,
        amountExtract: Math.abs(transaction.amount),
        payeeExtract: transaction.payee,
        transactionTypeExtract: transaction.amount >= 0 ? "INCOME" : "EXPENSE",
        status: "MANUAL",
      });
      tagsForLedgers.push(currentTagIds);
    } 

    if (ledgerDataForCreation.length === 0) {
      return new Response(
        JSON.stringify({
          message:
            "Transactions parsed, but none could be prepared for creation due to errors.",
          ok: false,
          processingErrors: dataProcessingErrors,
          requestId,
          transactionsCreated: 0,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const createdLedgers = await prisma.ledger.createManyAndReturn({
      data: ledgerDataForCreation,
      // skipDuplicates: true // Consider if needed for Ledger model
    });

    // --- Step 3: Prepare and Bulk Create TagsOnLedgers Links ---
    const tagsOnLedgersData = [];
    if (createdLedgers.length !== ledgerDataForCreation.length) {
      // This indicates an issue, potentially createManyAndReturn didn't work as expected
      // Or the order assumption is violated, or skipDuplicates removed some ledgers.
      console.warn(
        `[Action ${requestId}] Mismatch between prepared ledger count (${ledgerDataForCreation.length}) and created ledger count/returned records (${createdLedgers.length}). Tag linking might be incomplete.`
      );
      // Decide how to handle this - maybe only process tags for returned records?
      // For now, we proceed assuming order holds for the returned records.
    }

    createdLedgers.forEach((ledger, index) => {
      const ledgerId = ledger.id; // Get the ID of the created ledger
      const correspondingTagIds = tagsForLedgers[index]; // Get tags based on index (RISKY)

      if (ledgerId && correspondingTagIds && correspondingTagIds.length > 0) {
        correspondingTagIds.forEach((tagId) => {
          tagsOnLedgersData.push({
            ledgerId: ledgerId,
            tagId: tagId,
          });
        });
      }
    });

    let linkResult = null;
    if (tagsOnLedgersData.length > 0) {
      linkResult = await prisma.tagsOnLedgers.createMany({
        data: tagsOnLedgersData,
        skipDuplicates: true, // Important for join table
      });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${
          createdLedgers.length
        } ledgers. Attempted to link ${linkResult?.count ?? 0} tags.`,
        ok: true,
        ledgersCreated: createdLedgers.length, // Or use count from result if available
        tagsLinked: linkResult?.count ?? 0,
        transactionsInputCount: parsedTransactions.length,
        transactionsSkipped: skippedCount,
        processingWarnings: dataProcessingErrors,
        requestId,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
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
