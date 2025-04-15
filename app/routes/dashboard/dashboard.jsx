import { SectionCards } from "~/components/section-cards";
import prisma from "~/utils/prismaClient";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
} from "~/utils/dateHelpers";

export async function loader({ params }) {
  if (!params?.teamId) return null;
  const teamId = Number(params.teamId);

  const now = new Date();

  // Time Ranges
  const thisWeekRange = { gte: startOfWeek(now), lte: endOfWeek(now) };
  const lastWeekRange = {
    gte: startOfWeek(subWeeks(now, 1)),
    lte: endOfWeek(subWeeks(now, 1)),
  };
  const thisMonthRange = { gte: startOfMonth(now), lte: endOfMonth(now) };
  const lastMonthRange = {
    gte: startOfMonth(subMonths(now, 1)),
    lte: endOfMonth(subMonths(now, 1)),
  };

  const baseWhere = {
    user: { teamId: teamId },
    status: { in: ["CREATED", "EXTRACTED", "MANUAL"] },
  };

  const [
    transactionsThisWeek,
    transactionsLastWeek,
    transactionsThisMonth,
    transactionsLastMonth,
  ] = await Promise.all([
    prisma.ledger.aggregate({
      where: { ...baseWhere, createdAt: thisWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, createdAt: lastWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, createdAt: thisMonthRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, createdAt: lastMonthRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
  ]);

  const [categoryGroupsThisWeek, categoryGroupsThisMonth] = await Promise.all([
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: { ...baseWhere, createdAt: thisWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: { ...baseWhere, createdAt: thisMonthRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
  ]);

  const categories = await prisma.category.findMany({
    where: { teamId },
    select: { id: true, categoryName: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    categories,
    categoryGroupsThisWeek,
    categoryGroupsThisMonth,
    transactions: {
      thisWeek: transactionsThisWeek,
      lastWeek: transactionsLastWeek,
      thisMonth: transactionsThisMonth,
      lastMonth: transactionsLastMonth,
    },
    timings: {
      now,
      thisWeekRange,
      thisMonthRange,
      lastWeekRange,
      lastMonthRange,
    },
  };
}

export default function Dashboard({ loaderData }) {
  return (
    <div>
      <SectionCards data={loaderData} />
    </div>
  );
}
