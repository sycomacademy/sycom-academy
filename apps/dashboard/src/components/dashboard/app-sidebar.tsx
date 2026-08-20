import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@sycom-learn/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboardIcon } from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [{ icon: LayoutDashboardIcon, label: "Overview", to: "/dashboard" }],
  },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar className="border-sidebar-border" collapsible="icon" variant="inset">
      <SidebarHeader>
        <Link
          className="flex w-fit items-center gap-2 text-sm font-semibold text-sidebar-foreground"
          to="/dashboard"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
            S
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ to, label, icon: Icon }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton
                      isActive={pathname === to}
                      render={<Link to={to} />}
                      size="lg"
                      tooltip={label}
                    >
                      <Icon className="size-5" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
