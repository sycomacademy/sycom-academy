import { Button } from "@sycom-learn/ui/components/button";
import { buttonVariants } from "@sycom-learn/ui/components/button-variants";
import { toastManager } from "@sycom-learn/ui/components/toast";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import Loader from "@/components/global/loader";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY, sessionQueryOptions } from "@/lib/auth/session";
import { invitationQueryOptions } from "@/lib/organization/invitation";

export const Route = createFileRoute("/accept-invitation/$invitationId")({
  head: () => ({
    meta: [{ title: "Accept invitation | Sycom" }],
  }),
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions());
    // Invitations are tied to an email address, so there is nothing to show a
    // guest. Sign in first, then come back here.
    if (!session) {
      throw redirect({ to: "/sign-in", search: { redirect: location.href } });
    }
  },
  component: AcceptInvitationPage,
});

function AcceptInvitationPage() {
  const { invitationId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const invitation = useQuery(invitationQueryOptions(invitationId));

  const accept = useMutation({
    mutationFn: async () => {
      const { data, error } = await authClient.organization.acceptInvitation({ invitationId });
      if (error) throw new Error(error.message ?? "Couldn't accept this invitation.");
      return data;
    },
    onSuccess: async () => {
      toastManager.add({ title: "Invitation accepted", type: "success" });
      // Accepting sets the active organization on the session.
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      await router.navigate({ to: "/dashboard", replace: true });
    },
    onError: (error) => {
      toastManager.add({ title: error.message, type: "error" });
    },
  });

  if (invitation.isPending) {
    return <Loader label="Loading invitation" />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        {invitation.isError || !invitation.data ? (
          <>
            <div className="space-y-2">
              <h1 className="text-lg font-medium tracking-tight">Invitation unavailable</h1>
              <p className="text-sm text-muted-foreground">
                This invitation may have expired, been cancelled, or been sent to a different email
                address.
              </p>
            </div>
            <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} to="/dashboard">
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-lg font-medium tracking-tight">
                Join {invitation.data.organizationName}
              </h1>
              <p className="text-sm wrap-break-word text-muted-foreground">
                {invitation.data.inviterEmail} invited you as{" "}
                <span className="text-foreground">{invitation.data.role}</span>.
              </p>
            </div>

            <Button
              className="w-full"
              loading={accept.isPending}
              onClick={() => accept.mutate()}
              size="lg"
              type="button"
            >
              Accept invitation
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
