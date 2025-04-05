import prisma from "~/utils/prismaClient";

export const loader = async ({ params }) => {
  const ledgerId = Number(params.ledgerId);

  const data = await prisma.ledger.findFirst({
    where: { id: ledgerId },
    select: {
      id: true,
      body: true,
    },
  });
  return new Response(JSON.stringify({ results: data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
