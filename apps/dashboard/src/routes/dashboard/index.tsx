import { Button } from "@sycom-learn/ui/components/button";
import { toastManager } from "@sycom-learn/ui/components/toast";
import { createFileRoute } from "@tanstack/react-router";

import { useUser } from "@/hooks/use-user";

const SAMPLE_TOASTS = [
  { title: "Signed in", type: "success" as const },
  {
    title: "Couldn't save",
    description: "Check your connection and try again.",
    type: "error" as const,
  },
  { title: "Invite sent", description: "They'll get an email shortly.", type: "info" as const },
  {
    title: "Seat limit",
    description: "You're using 18 of 20 seats.",
    type: "warning" as const,
  },
  {
    title: "Progress sync failed",
    type: "error" as const,
    actionProps: { children: "Retry" },
  },
];

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [{ title: "Overview | Sycom" }],
  }),
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const session = useUser();

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-medium tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.name}. Everything the server knows about this session:
          </p>
        </div>
        <Button
          onClick={() => {
            const toast = SAMPLE_TOASTS[Math.floor(Math.random() * SAMPLE_TOASTS.length)];
            toastManager.add(toast);
          }}
          size="sm"
          variant="outline"
        >
          Test toast
        </Button>
      </div>

      <pre className="overflow-x-auto rounded border bg-muted/40 p-4 font-mono text-xs">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
