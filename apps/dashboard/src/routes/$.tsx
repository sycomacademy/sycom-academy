import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "@/components/global/not-found";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [{ title: "Page not found | Sycom" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: NotFound,
});
