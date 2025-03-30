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
                value={selectedTeam?.teamId || ""}
                onChange={(e) => {
                  const team = teams.find(
                    (t) => t.teamId === Number(e.target.value)
                  );
                  if (team) {
                    setSelectedTeam(team);
                    window.location.href = `/${team.teamId}/${activeNavItem.url}`; // Only navigate on selection
                  }
                }}
                className="text-base font-semibold"
              >
                {teams.map((team,i) => (
                  <option key={i} value={team.teamId}>
                    {team.name}
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
