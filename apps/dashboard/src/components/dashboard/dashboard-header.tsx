import { SidebarTrigger } from "@sycom-learn/ui/components/sidebar";

import { DashboardUserMenu } from "@/components/dashboard/dashboard-user-menu";

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-y px-4">
      <SidebarTrigger />
      <div className="flex items-center gap-3 md:px-2">
        <DashboardUserMenu />
      </div>
    </header>
  );
}
