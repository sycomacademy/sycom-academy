import { createFileRoute } from "@tanstack/react-router";

import { useUser } from "@/hooks/use-user";

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
      <div className="space-y-1">
        <h1 className="text-lg font-medium tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.name}. Everything the server knows about this session:
        </p>
      </div>

      <pre className="overflow-x-auto rounded border bg-muted/40 p-4 font-mono text-xs">
        {JSON.stringify(session, null, 2)}
      </pre>
    </div>
  );
}
