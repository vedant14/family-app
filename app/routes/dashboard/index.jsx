import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";

import data from "../../dashboard/data.json";
import { useAuthStore } from "~/utils/store";
import prisma from "~/utils/prismaClient";
import { verifyIdToken } from "~/utils/authHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import { useEffect } from "react";

export default function Page() {
  return (
    <div>
      <SectionCards />
      <DataTable data={data} />
    </div>
  );
}
