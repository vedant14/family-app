import { SectionCards } from "~/components/section-cards";
import prisma from "~/utils/prismaClient";
import {
  startOfWeekUTC,
  endOfWeekUTC,
  startOfMonthUTC,
  endOfMonthUTC,
  subWeeksUTC,
  subMonthsUTC,
} from "~/utils/dateHelpers";
export async function loader({ params }) {
  if (!params?.teamId) return null;
  const teamId = Number(params.teamId);

  const nowUTC = new Date(); // This will be in the server's local timezone initially
  const nowForUTC = new Date(nowUTC.toISOString()); // Convert to a UTC Date object
  // Time Ranges in UTC
  const thisWeekRange = {
    gte: startOfWeekUTC(nowForUTC),
    lte: endOfWeekUTC(nowForUTC),
  };
  const lastWeekRange = {
    gte: startOfWeekUTC(subWeeksUTC(nowForUTC, 1)),
    lte: endOfWeekUTC(subWeeksUTC(nowForUTC, 1)),
  };
  const thisMonthRange = {
    gte: startOfMonthUTC(nowForUTC),
    lte: endOfMonthUTC(nowForUTC),
  };
  const lastMonthRange = {
    gte: startOfMonthUTC(subMonthsUTC(nowForUTC, 1)),
    lte: endOfMonthUTC(subMonthsUTC(nowForUTC, 1)),
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
      where: { ...baseWhere, date: thisWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, date: lastWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, date: thisMonthRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: { ...baseWhere, date: lastMonthRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
  ]);

  const [categoryGroupsThisWeek, categoryGroupsThisMonth] = await Promise.all([
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: { ...baseWhere, date: thisWeekRange },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: { ...baseWhere, date: thisMonthRange },
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
