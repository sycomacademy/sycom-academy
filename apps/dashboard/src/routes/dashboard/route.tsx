import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RouteError } from "@/components/global/error";
import Loader from "@/components/global/loader";
import { NotFound } from "@/components/global/not-found";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard | Sycom" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (!session) {
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.href },
      });
    }
  },
  component: DashboardLayout,
  pendingComponent: () => <Loader className="min-h-svh" label="Loading workspace..." />,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}
