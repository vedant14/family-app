import { useEffect } from "react";
import { useNavigate } from "react-router";
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
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    if (selectedTeam?.teamId) {
      navigate(`/${selectedTeam.teamId}`);
    }
  }, [selectedTeam]);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <select
                value={selectedTeam?.teamId || ""}
                onChange={(e) => {
                  const team = teams.find(
                    (t) => t.teamId === Number(e.target.value)
                  );
                  setSelectedTeam(team);
                }}
                className="text-base font-semibold"
              >
                {teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.team}
                  </option>
                ))}
              </select>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="divide-y-1">
        <NavMain items={data.navMain} activeNavItem={activeNavItem} />
        <NavMain items={data.navTeam} activeNavItem={activeNavItem} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
