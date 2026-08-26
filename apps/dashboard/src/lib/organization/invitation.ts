import { queryOptions } from "@tanstack/react-query";

import { authClient } from "@/lib/auth/auth-client";

export const INVITATION_QUERY_KEY = ["invitation"] as const;

export const invitationQueryKey = (invitationId: string) =>
  [...INVITATION_QUERY_KEY, invitationId] as const;

/**
 * Better Auth only hands an invitation to a signed-in, verified user whose email
 * matches it, so this doubles as the check that the link belongs to whoever is
 * looking at it.
 */
export const invitationQueryOptions = (invitationId: string) =>
  queryOptions({
    queryKey: invitationQueryKey(invitationId),
    queryFn: async () => {
      const { data, error } = await authClient.organization.getInvitation({
        query: { id: invitationId },
      });

      if (error) throw new Error(error.message ?? "This invitation is no longer valid.");
      return data;
    },
    retry: false,
  });
