import prisma from "utils/prismaClient";
export const loader = async () => {
  try {
    const sources = await prisma.source.findMany({
      select: {
        id: true,
        sourceName: true,
        sourceType: true,
        query: true,
        payeeRegex: true,
        payeeRegexBackup: true,
        amountRegex: true,
        amountRegexBackup: true,
        user: {
          select: {
            email: true, // Only include the user's email
          },
        },
      },
    });

    return new Response(JSON.stringify(sources), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Error fetching sources",
        requestId: crypto.randomUUID(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
