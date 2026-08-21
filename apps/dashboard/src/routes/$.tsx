import { createFileRoute, redirect } from "@tanstack/react-router";

import Loader from "@/components/global/loader";
import { NotFound } from "@/components/global/not-found";
import { sessionQueryOptions } from "@/lib/auth/session";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [{ title: "Page not found | Sycom" }, { name: "robots", content: "noindex, nofollow" }],
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
  pendingComponent: () => <Loader className="min-h-svh" />,
  component: NotFound,
});
