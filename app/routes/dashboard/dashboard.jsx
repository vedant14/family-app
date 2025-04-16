import prisma from "~/utils/prismaClient";
import {
  startOfWeekUTC,
  endOfWeekUTC,
  startOfMonthUTC,
  endOfMonthUTC,
  subWeeksUTC,
  subMonthsUTC,
} from "~/utils/dateHelpers";
import { Link } from "react-router";
import { IconTrendingDown, IconTrendingUp } from "~/components/ui/icons";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { formatIndianCurrency } from "~/utils/helperFunctions";
import { useAuthStore } from "~/utils/store";
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
    investmentsThisMonth,
    investmentsLastMonth,
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
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        category: { isInvestment: true },
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        category: { isInvestment: true },
      },
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
    select: { id: true, categoryName: true, colorCode: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    teamId,
    categories,
    categoryGroupsThisWeek,
    categoryGroupsThisMonth,
    transactions: {
      thisWeek: transactionsThisWeek,
      lastWeek: transactionsLastWeek,
      thisMonth: transactionsThisMonth,
      lastMonth: transactionsLastMonth,
      investmentsThisMonth,
      investmentsLastMonth,
    },
    timings: {
      thisWeekRange,
      thisMonthRange,
      lastWeekRange,
      lastMonthRange,
    },
  };
}
export function HydrateFallback() {
  return <div>Loading...</div>;
}
export default function Dashboard({ loaderData }) {
  if (!loaderData) {
    return;
  }
  const {
    transactions,
    categories,
    categoryGroupsThisWeek,
    categoryGroupsThisMonth,
    teamId,
  } = loaderData;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
      <div className="grid grid-cols-2 gap-4">
        <Card className="@container/card h-fit">
          <CardHeader>
            <CardDescription>Spends this week</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatIndianCurrency(transactions.thisWeek._sum.amountExtract)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={transactions.lastWeek._sum.amountExtract}
                  newValue={transactions.thisWeek._sum.amountExtract}
                  showValue={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last week
              <ShowArrow
                oldValue={transactions.lastWeek._sum.amountExtract}
                newValue={transactions.thisWeek._sum.amountExtract}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(transactions.lastWeek._sum.amountExtract)}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card h-fit">
          <CardHeader>
            <CardDescription>Spends this month</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatIndianCurrency(transactions.thisMonth._sum.amountExtract)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={transactions.lastMonth._sum.amountExtract}
                  newValue={transactions.thisMonth._sum.amountExtract}
                  showValue={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last month
              <ShowArrow
                oldValue={transactions.lastMonth._sum.amountExtract}
                newValue={transactions.thisMonth._sum.amountExtract}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(transactions.lastMonth._sum.amountExtract)}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card h-fit">
          <CardHeader>
            <CardDescription>Investments this month</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatIndianCurrency(
                transactions.investmentsThisMonth._sum.amountExtract
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={
                    transactions.investmentsLastMonth._sum.amountExtract
                  }
                  newValue={
                    transactions.investmentsThisMonth._sum.amountExtract
                  }
                  showValue={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last month
              <ShowArrow
                oldValue={transactions.investmentsLastMonth._sum.amountExtract}
                newValue={transactions.investmentsThisMonth._sum.amountExtract}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(
                transactions.investmentsLastMonth._sum.amountExtract
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Category-wise spends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead className="text-muted-foreground text-xs sm:text-sm">
                  <tr>
                    <th className="text-left px-2 py-1">Category</th>
                    <th className="text-right px-2 py-1">This Week</th>
                    <th className="text-right px-2 py-1">This Month</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const thisWeek = categoryGroupsThisWeek.find(
                      (g) => g.categoryId === category.id
                    );
                    const thisMonth = categoryGroupsThisMonth.find(
                      (g) => g.categoryId === category.id
                    );

                    return (
                      <tr
                        key={category.id}
                        className="hover:bg-muted/30 rounded"
                      >
                        <td>
                          <Link
                            to={`/${teamId}/ledger?category=${category.id}`}
                            className="font-medium px-2.5 py-1 rounded-lg text-xs"
                            style={{
                              backgroundColor: category.colorCode || "#808080",
                            }}
                          >
                            {category.categoryName}
                          </Link>
                        </td>
                        <td className="text-right px-2 py-1 text-muted-foreground">
                          {formatIndianCurrency(
                            thisWeek?._sum?.amountExtract ?? 0
                          )}
                        </td>
                        <td className="text-right px-2 py-1 text-muted-foreground">
                          {formatIndianCurrency(
                            thisMonth?._sum?.amountExtract ?? 0
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const ShowArrow = ({
  newValue,
  oldValue,
  showValue = false,
  downGood = true,
}) => {
  const number = showValue
    ? Math.round(((newValue - oldValue) / newValue) * 100)
    : null;
  const isDown = oldValue > newValue;

  return (
    <>
      {isDown ? (
        <IconTrendingDown className="size-5 stroke-green-600" />
      ) : (
        <IconTrendingUp className="size-5 stroke-red-400" />
      )}
      {number !== null && <span>{number} %</span>}
    </>
  );
};
