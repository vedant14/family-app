import { Link } from "react-router";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { useAuthStore } from "~/utils/store";

export function NavMain({ items, activeNavItem }) {
  const selectedTeam = useAuthStore((state) => state.selectedTeam);

  if (!selectedTeam) {
    return;
  }
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item, i) => (
            <SidebarMenuItem key={i}>
              <Link to={`${selectedTeam.teamId}/${item.url}`}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={activeNavItem.url === item.url ? true : false}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
