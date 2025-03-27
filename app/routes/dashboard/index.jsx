import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";

import data from "../../dashboard/data.json";

export default function Page() {
  return (
    <div>
      <SectionCards />
      <DataTable data={data} />
    </div>
  );
}
