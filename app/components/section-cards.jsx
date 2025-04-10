import { IconTrendingDown, IconTrendingUp } from "./ui/icons";

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

export function SectionCards({ data }) {
  const ShowArrow = ({ newValue, oldValue, showValue = false }) => {
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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4 mb-4">
      <Card className="@container/card h-fit">
        <CardHeader>
          <CardDescription>Spends this week</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatIndianCurrency(
              data.transactions.thisWeek._sum.amountExtract
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ShowArrow
                oldValue={data.transactions.lastWeek._sum.amountExtract}
                newValue={data.transactions.thisWeek._sum.amountExtract}
                showValue={true}
              />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Compared to last week
            <ShowArrow
              oldValue={data.transactions.lastWeek._sum.amountExtract}
              newValue={data.transactions.thisWeek._sum.amountExtract}
            />
          </div>
          <div className="text-muted-foreground">
            {formatIndianCurrency(
              data.transactions.lastWeek._sum.amountExtract
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card h-fit">
        <CardHeader>
          <CardDescription>Spends this month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatIndianCurrency(
              data.transactions.thisMonth._sum.amountExtract
            )}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ShowArrow
                oldValue={data.transactions.lastMonth._sum.amountExtract}
                newValue={data.transactions.thisMonth._sum.amountExtract}
                showValue={true}
              />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Compared to last month
            <ShowArrow
              oldValue={data.transactions.lastMonth._sum.amountExtract}
              newValue={data.transactions.thisMonth._sum.amountExtract}
            />
          </div>
          <div className="text-muted-foreground">
            {formatIndianCurrency(
              data.transactions.lastMonth._sum.amountExtract
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card col-span-2">
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
                {data.categories.map((category) => {
                  const thisWeek = data.categoryGroupsThisWeek.find(
                    (g) => g.categoryId === category.id
                  );
                  const thisMonth = data.categoryGroupsThisMonth.find(
                    (g) => g.categoryId === category.id
                  );

                  return (
                    <tr key={category.id} className="hover:bg-muted/30 rounded">
                      <td className="font-medium px-2 py-1">
                        {category.categoryName}
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
  );
}
