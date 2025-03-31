import { Dialog } from "@radix-ui/react-dialog";
import { IconCirclePlusFilled } from "./ui/icons";
import { Link } from "react-router";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { DialogTrigger } from "./ui/dialog";
import { SourceForm } from "~/dashboard/create-source-form";
import { useAuthStore, useDialogStore } from "~/utils/store";

export function NavMain({ items, activeNavItem }) {
  const open = useDialogStore((state) => state.open);
  const toggleOpen = useDialogStore((state) => state.toggleOpen);
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
