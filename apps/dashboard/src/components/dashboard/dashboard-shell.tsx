import { Separator } from "@sycom-learn/ui/components/separator";
import { SidebarInset, SidebarProvider } from "@sycom-learn/ui/components/sidebar";
import type * as React from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className="flex max-h-[calc(100vh-16px)] flex-col overflow-auto border-x md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-0"
        role="main"
      >
        <DashboardHeader />
        <Separator aria-hidden="true" className="bg-secondary" />
        <div className="flex min-h-0 flex-1 flex-col p-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
