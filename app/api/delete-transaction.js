import prisma from "~/utils/prismaClient";

export const action = async ({ params }) => {
  try {
    const deleteTransaction = await prisma.ledger.delete({
      where: {
        id: Number(params.ledgerId),
      },
      select: {
        id: true,
      },
    });
    return new Response(JSON.stringify(deleteTransaction), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);

    return new Response(
      JSON.stringify({
        error: "Authentication failed",
        requestId: crypto.randomUUID(), // For error tracking
      }),
      {
        status: error.response?.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
