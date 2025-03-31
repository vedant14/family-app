import { Outlet, useLocation } from "react-router";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { Skeleton } from "~/components/ui/skeleton";

import {
  IconFilterCheck,
  IconReceipt,
  IconSparkles,
  IconCardboards,
  IconUsers,
  IconCalendarDollar,
  IconFolderFilled,
  IconCategory2,
} from "~/components/ui/icons";
import { parseCookies } from "~/utils/helperFunctions";

const data = {
  navMain: [
    { title: "Dashboard", url: "", icon: IconCardboards },
    { title: "Ledger", url: "ledger", icon: IconReceipt },
    { title: "AI", url: "ai", icon: IconSparkles },
  ],
  navTeam: [
    { title: "Teams Space", url: "manage-team", icon: IconUsers },
    { title: "Sources", url: "sources", icon: IconFilterCheck },
    { title: "Categories", url: "categories", icon: IconCategory2 },
    { title: "Budgets", url: "budgets", icon: IconCalendarDollar },
  ],
};

export default function DashboardLayout() {
  const location = useLocation();
  const activeNavItem =
    [...data.navMain, ...data.navTeam].find(
      (item) => location.pathname.split("/").slice(-1)[0] === item.url
    ) || data.navMain[0];

  const activeTitle = activeNavItem.title;
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 60)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" data={data} activeNavItem={activeNavItem} />
      <SidebarInset>
        <SiteHeader title={activeTitle} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
