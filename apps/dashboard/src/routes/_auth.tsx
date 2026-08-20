import { Link, Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import * as z from "zod/mini";

import { AuthLeftPanel } from "@/components/auth/left-panel";
import { safeRedirectPath } from "@/lib/auth/auth-redirect";
import { sessionQueryOptions } from "@/lib/auth/session";

const authSearchSchema = z.object({
  redirect: z.optional(z.string()),
});

export const Route = createFileRoute("/_auth")({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    if (session) {
      throw redirect({ href: safeRedirectPath(search.redirect) ?? "/dashboard" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex min-h-svh bg-background p-1">
      <div className="relative hidden overflow-hidden bg-foreground lg:flex lg:w-1/2">
        <AuthLeftPanel />
      </div>

      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="flex h-full w-full max-w-md flex-col">
          <div className="mb-8 flex items-center lg:hidden">
            <Link className="flex items-center gap-2" to="/sign-in">
              <span className="flex size-12 items-center justify-center rounded bg-primary text-lg font-semibold text-primary-foreground">
                S
              </span>
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
