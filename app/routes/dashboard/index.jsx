import { ChartAreaInteractive } from "~/components/chart-area-interactive";
import { DataTable } from "~/components/data-table";
import { SectionCards } from "~/components/section-cards";

import data from "../../dashboard/data.json";
import { useAuthStore } from "~/utils/store";
import prisma from "~/utils/prismaClient";
import { verifyIdToken } from "~/utils/authHelpers";
import { parseCookies } from "~/utils/helperFunctions";
import { useEffect } from "react";

export async function loader({ request }) {
  const header = Object.fromEntries(request.headers);
  const cookie = parseCookies(header.cookie);
  const verifyUser = await verifyIdToken(cookie.user);
  const teamData = await prisma.teamUser.findMany({
    where: {
      user: {
        email: {
          equals: "vedant.lohbare@gmail.com",
        },
      },
    },
    select: {
      id: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  });
  const teams = teamData.map(({ id, team }) => ({
    id,
    team: team.name,
  }));

  return teams;
}

export default function Page({ loaderData }) {
  const setTeams = useAuthStore((state) => state.setTeams);
  const teams = loaderData;
  useEffect(() => {
    if (teams) {
      setTeams(teams);
    }
  }, [teams]);
  return (
    <div>
      <SectionCards />
      <DataTable data={data} />
    </div>
  );
}
