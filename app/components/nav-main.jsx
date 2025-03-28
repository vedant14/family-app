import { Dialog } from "@radix-ui/react-dialog";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { Link } from "react-router";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { DialogTrigger } from "./ui/dialog";
import { SourceForm } from "~/dashboard/forms";
import { useDialogStore } from "~/utils/store";

export function NavMain({ items, activeNavItem }) {
  const open = useDialogStore((state) => state.open);
  const toggleOpen = useDialogStore((state) => state.toggleOpen);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {activeNavItem.actionTitle && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <Dialog open={open}>
                {activeNavItem.onAction}

                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  onClick={toggleOpen}
                >
                  <IconCirclePlusFilled />
                  <span>{activeNavItem.actionTitle}</span>
                </SidebarMenuButton>
              </Dialog>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link to={item.url}>
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
