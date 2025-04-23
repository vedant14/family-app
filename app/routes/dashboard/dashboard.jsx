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

  const nowUTC = new Date();
  const nowForUTC = new Date(nowUTC.toISOString());
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
    category: { isDontTrack: false },
  };

  const [
    expensesThisWeek,
    incomeThisWeek,
    expensesLastWeek,
    incomeLastWeek,
    expensesThisMonth,
    incomeThisMonth,
    expensesLastMonth,
    incomeLastMonth,
    investmentsThisMonth,
    investmentsLastMonth,
  ] = await Promise.all([
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        category: { isInvestment: true },
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        category: { isInvestment: true },
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
  ]);

  const transactions = {
    thisWeek: {
      count: expensesThisWeek._count.id + incomeThisWeek._count.id,
      amount:
        (expensesThisWeek._sum.amountExtract || 0) -
        (incomeThisWeek._sum.amountExtract || 0),
    },
    lastWeek: {
      count: expensesLastWeek._count.id + incomeLastWeek._count.id,
      amount:
        (expensesLastWeek._sum.amountExtract || 0) -
        (incomeLastWeek._sum.amountExtract || 0),
    },
    thisMonth: {
      count: expensesThisMonth._count.id + incomeThisMonth._count.id,
      amount:
        (expensesThisMonth._sum.amountExtract || 0) -
        (incomeThisMonth._sum.amountExtract || 0),
    },
    lastMonth: {
      count: expensesLastMonth._count.id + incomeLastMonth._count.id,
      amount:
        (expensesLastMonth._sum.amountExtract || 0) -
        (incomeLastMonth._sum.amountExtract || 0),
    },
    investmentsThisMonth: {
      count: investmentsThisMonth._count.id,
      amount: investmentsThisMonth._sum.amountExtract || 0,
    },
    investmentsLastMonth: {
      count: investmentsLastMonth._count.id,
      amount: investmentsLastMonth._sum.amountExtract || 0,
    },
  };

  const [
    categoryExpensesThisWeek,
    categoryIncomesThisWeek,
    categoryExpensesThisMonth,
    categoryIncomesThisMonth,
  ] = await Promise.all([
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _count: { id: true },
      _sum: { amountExtract: true },
    }),
  ]);

  const mergeCategoryGroups = (expenses, incomes) => {
    const merged = {};

    expenses.forEach((exp) => {
      merged[exp.categoryId] = {
        count: exp._count.id,
        amount: -(exp._sum.amountExtract || 0),
      };
    });

    incomes.forEach((inc) => {
      if (merged[inc.categoryId]) {
        merged[inc.categoryId].count += inc._count.id;
        merged[inc.categoryId].amount += inc._sum.amountExtract || 0;
      } else {
        merged[inc.categoryId] = {
          count: inc._count.id,
          amount: inc._sum.amountExtract || 0,
        };
      }
    });

    return Object.entries(merged).map(([categoryId, data]) => ({
      categoryId: Number(categoryId),
      _count: { id: data.count },
      _sum: { amountExtract: data.amount },
    }));
  };

  const categoryGroupsThisWeek = mergeCategoryGroups(
    categoryExpensesThisWeek,
    categoryIncomesThisWeek
  );
  const categoryGroupsThisMonth = mergeCategoryGroups(
    categoryExpensesThisMonth,
    categoryIncomesThisMonth
  );

  const categories = await prisma.category.findMany({
    where: { teamId, isDontTrack: false },
    select: { id: true, categoryName: true, colorCode: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    teamId,
    categories,
    categoryGroupsThisWeek,
    categoryGroupsThisMonth,
    transactions,
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
              {formatIndianCurrency(transactions.thisWeek.amount)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={transactions.lastWeek.amount}
                  newValue={transactions.thisWeek.amount}
                  showValue={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last week
              <ShowArrow
                oldValue={transactions.lastWeek.amount}
                newValue={transactions.thisWeek.amount}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(transactions.lastWeek.amount)}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card h-fit">
          <CardHeader>
            <CardDescription>Spends this month</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatIndianCurrency(transactions.thisMonth.amount)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={transactions.lastMonth.amount}
                  newValue={transactions.thisMonth.amount}
                  showValue={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last month
              <ShowArrow
                oldValue={transactions.lastMonth.amount}
                newValue={transactions.thisMonth.amount}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(transactions.lastMonth.amount)}
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card h-fit">
          <CardHeader>
            <CardDescription>Investments this month</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatIndianCurrency(transactions.investmentsThisMonth.amount)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <ShowArrow
                  oldValue={transactions.investmentsLastMonth.amount}
                  newValue={transactions.investmentsThisMonth.amount}
                  showValue={true}
                  reverseColors={true}
                />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Compared to last month
              <ShowArrow
                oldValue={transactions.investmentsLastMonth.amount}
                newValue={transactions.investmentsThisMonth.amount}
                reverseColors={true}
              />
            </div>
            <div className="text-muted-foreground">
              {formatIndianCurrency(transactions.investmentsLastMonth.amount)}
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
  reverseColors = false,
}) => {
  const percentageChange =
    newValue !== 0 && showValue
      ? Math.round(((newValue - oldValue) / Math.abs(newValue)) * 100)
      : null;

  if (newValue === oldValue) {
    return showValue ? <span>0 %</span> : null;
  }

  const isDown = oldValue > newValue;
  const downArrowColor = reverseColors ? "stroke-red-400" : "stroke-green-600";
  const upArrowColor = reverseColors ? "stroke-green-600" : "stroke-red-400";

  return (
    <>
      {isDown ? (
        <IconTrendingDown className={`size-5 ${downArrowColor}`} />
      ) : (
        <IconTrendingUp className={`size-5 ${upArrowColor}`} />
      )}
      {percentageChange !== null && (
        <span className="ml-1">{percentageChange} %</span>
      )}
    </>
  );
};
