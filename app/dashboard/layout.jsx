import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { AppSidebar } from "~/components/app-sidebar";
import { useAuthStore } from "~/utils/store";
import { Skeleton } from "~/components/ui/skeleton";
import {
  IconFolder,
  IconReceipt,
  IconSparkles,
  IconCardboards,
  IconUsers,
} from "@tabler/icons-react";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { SourceForm } from "./forms";
import { Button } from "~/components/ui/button";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconCardboards,
    },
    {
      title: "Ledger",
      url: "/ledger",
      actionTitle: "",
      onAction: <SourceForm />,
      icon: IconReceipt,
    },
    {
      title: "AI",
      url: "/ai",
      actionTitle: "",
      onAction: <SourceForm />,
      icon: IconSparkles,
    },
    {
      title: "Family",
      url: "/family",
      actionTitle: "",
      onAction: <SourceForm />,
      icon: IconUsers,
    },
    {
      title: "Sources",
      url: "/sources",
      actionTitle: "Add Source",
      onAction: <SourceForm />,
      icon: IconFolder,
    },
  ],
};

export default function DashboardLayout({}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!user) {
      const timeout = setTimeout(() => {
        // logout(); // Call your logout function
        navigate("/login");
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [user]);

  if (isLoading || user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-40 ml-4" />
      </div>
    );
  }

  const activeNavItem = data.navMain.find(
    (item) => location.pathname === item.url
  );
  const activeTitle = activeNavItem ? activeNavItem.title : "Dashboard"; // Default title

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
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
