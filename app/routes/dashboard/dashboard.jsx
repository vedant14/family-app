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
import {
  IconReceipt,
  IconTrendingDown,
  IconTrendingUp,
} from "~/components/ui/icons";
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
  const teamIdParam = params?.teamId;
  if (!teamIdParam) {
    throw new Response("Team ID parameter is required.", { status: 400 });
  }
  const teamId = parseInt(teamIdParam, 10);
  if (isNaN(teamId) || teamId <= 0) {
    throw new Response("Invalid Team ID format.", { status: 400 });
  }

  const currentUTC = new Date(new Date().toISOString());

  const thisWeekRange = {
    gte: startOfWeekUTC(currentUTC),
    lte: endOfWeekUTC(currentUTC),
  };
  const lastWeekRange = {
    gte: startOfWeekUTC(subWeeksUTC(currentUTC, 1)),
    lte: endOfWeekUTC(subWeeksUTC(currentUTC, 1)),
  };
  const thisMonthRange = {
    gte: startOfMonthUTC(currentUTC),
    lte: endOfMonthUTC(currentUTC),
  };
  const lastMonthRange = {
    gte: startOfMonthUTC(subMonthsUTC(currentUTC, 1)),
    lte: endOfMonthUTC(subMonthsUTC(currentUTC, 1)),
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
    categoryExpensesThisWeek,
    categoryIncomesThisWeek,
    categoryExpensesThisMonth,
    categoryIncomesThisMonth,
    tagsDataThisMonth,
    tagsDataLastMonth,
    categories,
  ] = await Promise.all([
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: thisMonthRange,
        category: { isInvestment: true },
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.aggregate({
      where: {
        ...baseWhere,
        date: lastMonthRange,
        category: { isInvestment: true },
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisWeekRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "EXPENSE",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.ledger.groupBy({
      by: ["categoryId"],
      where: {
        ...baseWhere,
        date: thisMonthRange,
        transactionTypeExtract: "INCOME",
      },
      _sum: { amountExtract: true },
      _count: { id: true },
    }),
    prisma.tagsOnLedgers.findMany({
      where: { ledger: { ...baseWhere, date: thisMonthRange } },
      select: {
        tag: { select: { id: true, tag: true, colorCode: true } },
        ledger: {
          select: { amountExtract: true, transactionTypeExtract: true },
        },
      },
    }),
    prisma.tagsOnLedgers.findMany({
      where: { ledger: { ...baseWhere, date: lastMonthRange } },
      select: {
        tag: { select: { id: true, tag: true, colorCode: true } },
        ledger: {
          select: { amountExtract: true, transactionTypeExtract: true },
        },
      },
    }),
    prisma.category.findMany({
      where: { teamId, isDontTrack: false },
      select: { id: true, categoryName: true, colorCode: true },
      orderBy: { categoryName: "asc" },
    }),
  ]);

  const calculateNetAmount = (incomeData, expenseData) => {
    const income = incomeData?._sum?.amountExtract || 0;
    const expense = expenseData?._sum?.amountExtract || 0;
    return { income, expense };
  };

  const mergeCategoryGroups = (expenses, incomes) => {
    const merged = new Map();
    expenses.forEach((exp) => {
      if (exp.categoryId === null) return;
      merged.set(exp.categoryId, {
        count: exp._count.id || 0,
        amount: -(exp._sum.amountExtract || 0),
      });
    });
    incomes.forEach((inc) => {
      if (inc.categoryId === null) return;
      const existing = merged.get(inc.categoryId);
      if (existing) {
        existing.count += inc._count.id || 0;
        existing.amount += inc._sum.amountExtract || 0;
      } else {
        merged.set(inc.categoryId, {
          count: inc._count.id || 0,
          amount: inc._sum.amountExtract || 0,
        });
      }
    });
    return Array.from(merged.entries()).map(([categoryId, data]) => ({
      categoryId: categoryId,
      _count: { id: data.count },
      _sum: { amountExtract: data.amount },
    }));
  };

  const groupAndSumTags = (tagLedgerData) => {
    const mergedTags = new Map();
    tagLedgerData.forEach((item) => {
      const { tag, ledger } = item;
      if (!tag || !ledger || !tag.id) return;
      const tagId = tag.id;
      const amount = ledger.amountExtract || 0;
      const isExpense = ledger.transactionTypeExtract === "EXPENSE";
      if (!mergedTags.has(tagId)) {
        mergedTags.set(tagId, {
          tagId: tag.id,
          tag: tag.tag,
          colorCode: tag.colorCode,
          count: 0,
          amount: 0,
        });
      }
      const currentTag = mergedTags.get(tagId);
      currentTag.count++;
      currentTag.amount += isExpense ? -amount : amount;
    });
    return Array.from(mergedTags.values());
  };

  const transactions = {
    thisWeek: {
      count:
        (expensesThisWeek._count.id || 0) + (incomeThisWeek._count.id || 0),
      amount: calculateNetAmount(incomeThisWeek, expensesThisWeek),
    },
    lastWeek: {
      count:
        (expensesLastWeek._count.id || 0) + (incomeLastWeek._count.id || 0),
      amount: calculateNetAmount(incomeLastWeek, expensesLastWeek),
    },
    thisMonth: {
      count:
        (expensesThisMonth._count.id || 0) + (incomeThisMonth._count.id || 0),
      amount: calculateNetAmount(incomeThisMonth, expensesThisMonth),
    },
    lastMonth: {
      count:
        (expensesLastMonth._count.id || 0) + (incomeLastMonth._count.id || 0),
      amount: calculateNetAmount(incomeLastMonth, expensesLastMonth),
    },
    investmentsThisMonth: {
      count: investmentsThisMonth._count.id || 0,
      amount: investmentsThisMonth._sum.amountExtract || 0,
    },
    investmentsLastMonth: {
      count: investmentsLastMonth._count.id || 0,
      amount: investmentsLastMonth._sum.amountExtract || 0,
    },
  };

  const categoryGroupsThisWeek = mergeCategoryGroups(
    categoryExpensesThisWeek,
    categoryIncomesThisWeek
  );
  const categoryGroupsThisMonth = mergeCategoryGroups(
    categoryExpensesThisMonth,
    categoryIncomesThisMonth
  );

  const processedTagsThisMonth = groupAndSumTags(tagsDataThisMonth);
  const processedTagsLastMonth = groupAndSumTags(tagsDataLastMonth);

  const allTagsMap = new Map();
  processedTagsThisMonth.forEach((tag) => {
    allTagsMap.set(tag.tagId, {
      ...tag,
      thisMonthAmount: tag.amount,
      lastMonthAmount: 0,
    });
  });
  processedTagsLastMonth.forEach((tag) => {
    const existingTagData = allTagsMap.get(tag.tagId);
    if (existingTagData) {
      existingTagData.lastMonthAmount = tag.amount;
    } else {
      allTagsMap.set(tag.tagId, {
        ...tag,
        thisMonthAmount: 0,
        lastMonthAmount: tag.amount,
      });
    }
  });
  const combinedTags = Array.from(allTagsMap.values());

  return {
    teamId,
    categories,
    categoryGroupsThisWeek,
    categoryGroupsThisMonth,
    transactions,
    combinedTags,
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
    combinedTags,
  } = loaderData;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs">
      <div className="grid grid-cols-2 gap-4">
        <DashboardCard
          title="Cashflow"
          values={[
            {
              value: transactions.thisMonth.amount.expense,
              label: "OUTGOINGS",
              shadowValue: transactions.lastMonth.amount.expense,
            },
            {
              value: transactions.thisMonth.amount.income,
              label: "INCOMINGS",
              shadowValue: transactions.lastMonth.amount.income,
              reverseColors: true,
            },
          ]}
          showMonth={true}
        />
        <DashboardCard
          title="This Week"
          values={[
            {
              value: transactions.thisWeek.amount.expense,
              label: "OUTGOINGS",
              shadowValue: transactions.lastWeek.amount.expense,
            },
            {
              value: transactions.thisWeek.amount.income,
              label: "INCOMINGS",
              shadowValue: transactions.thisWeek.amount.income,
              reverseColors: true,
            },
          ]}
          showMonth={false}
        />
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
      <div className="grid grid-cols-1 gap-4">
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
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Tags-wise spends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-1">
                <thead className="text-muted-foreground text-xs sm:text-sm">
                  <tr>
                    <th className="text-left px-2 py-1">Tags</th>
                    <th className="text-right px-2 py-1">This Month</th>
                    <th className="text-right px-2 py-1">Last Month</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedTags.map((tag) => {
                    return (
                      <tr key={tag.tagId} className="hover:bg-muted/30 rounded">
                        <td>
                          <Link
                            to={`/${teamId}/ledger?tag=${tag.tagId}`}
                            className="font-medium px-2.5 py-1 rounded-lg text-xs"
                            style={{
                              backgroundColor: tag.colorCode || "#dddeee",
                            }}
                          >
                            {tag.tag}
                          </Link>
                        </td>
                        <td className="text-right px-2 py-1 text-muted-foreground">
                          {formatIndianCurrency(tag.thisMonthAmount)}
                        </td>
                        <td className="text-right px-2 py-1 text-muted-foreground">
                          {formatIndianCurrency(tag.lastMonthAmount)}
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

const ShowArrow = ({ newValue, oldValue, reverseColors = false }) => {
  const isDown = oldValue > newValue;
  const downArrowColor = reverseColors ? "stroke-red-400" : "stroke-green-600";
  const upArrowColor = reverseColors ? "stroke-green-600" : "stroke-red-400";

  return (
    <>
      {isDown ? (
        <IconTrendingDown className={`size-4 ${downArrowColor}`} />
      ) : (
        <IconTrendingUp className={`size-4 ${upArrowColor}`} />
      )}
    </>
  );
};

function DashboardCard({ title, values, showMonth }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription className="flex justify-between items-center">
          <div className="flex gap-x-1">
            <IconReceipt className="h-5 text-gray-500" />
            <span>{title}</span>
          </div>
          {/* <div className="w-24">
            <select className="w-full border border-gray-200 text-gray-700 py-1.5 px-3 rounded-md leading-tight focus:outline-none text-xs appearance-none">
              <option>May 2025</option>
            </select>
          </div> */}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <div className="w-full">
          {values.map((value, index) => (
            <div
              className="group flex justify-between items-center mb-4"
              key={index}
            >
              <div className="flex items-center space-x-1">
                <span className="text-neutral-700 font-semibold whitespace-nowrap text-2xl">
                  {formatIndianCurrency(value.value)}
                </span>
                <span
                  className="text-neutral-400 whitespace-nowrap overflow-hidden 
                   opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-md group-hover:ml-2 text-sm
                   transition-all duration-400 ease-in-out"
                >
                  {formatIndianCurrency(value.shadowValue)}
                </span>
                <div className="transition-all duration-400 ease-in-out">
                  <ShowArrow
                    oldValue={value.shadowValue}
                    newValue={value.value}
                    reverseColors={value.reverseColors}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500">{value.label}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
