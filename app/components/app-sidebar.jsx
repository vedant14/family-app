import { IconInnerShadowTop } from "@tabler/icons-react";
import { Link } from "react-router";
import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { useAuthStore } from "~/utils/store";

export function AppSidebar({ data, activeNavItem }) {
  const teams = useAuthStore((state) => state.teams);
  const selectedTeam = useAuthStore((state) => state.selectedTeam);
  const setSelectedTeam = useAuthStore((state) => state.setSelectedTeam);
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <select
                value={selectedTeam?.id || ""}
                onChange={(e) => {
                  const team = teams.find(
                    (t) => t.id === Number(e.target.value)
                  );
                  setSelectedTeam(team);
                }}
                className="text-base font-semibold"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.team}
                  </option>
                ))}
              </select>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} activeNavItem={activeNavItem} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
