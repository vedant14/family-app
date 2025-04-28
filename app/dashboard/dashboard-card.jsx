import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  IconReceipt,
  IconTrendingDown,
  IconTrendingUp,
} from "~/components/ui/icons";
import { Badge } from "~/components/ui/badge";
import { formatIndianCurrency } from "~/utils/helperFunctions";
import { Link } from "react-router";

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

export function DashboardCard({ title, values, showMonth }) {
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

export function DashboardSimpleCard({ title, values }) {
  const { primary, shadowValue } = values; // Destructure the values prop

  return (
    <Card className="@container/card h-fit">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formatIndianCurrency(primary)}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <ShowArrow
              oldValue={primary}
              newValue={shadowValue}
              reverseColors={true}
            />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Compared to last month
          <ShowArrow
            oldValue={primary}
            newValue={shadowValue}
            reverseColors={true}
          />
        </div>
        <div className="text-muted-foreground">
          {formatIndianCurrency(shadowValue)}
        </div>
      </CardFooter>
    </Card>
  );
}
