import { Avatar, AvatarFallback, AvatarImage } from "@sycom-learn/ui/components/avatar";
import { Button } from "@sycom-learn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sycom-learn/ui/components/dropdown-menu";
import { toastManager } from "@sycom-learn/ui/components/toast";
import { getInitials } from "@sycom-learn/ui/lib/string";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";

import { useUser } from "@/hooks/use-user";
import { authClient } from "@/lib/auth/auth-client";
import { SESSION_QUERY_KEY } from "@/lib/auth/session";

export function DashboardUserMenu() {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();
      if (error) {
        toastManager.add({ title: error.message, type: "error" });
        return;
      }

      toastManager.add({ title: "Signed out", type: "success" });
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY });
      await router.navigate({ to: "/sign-in", replace: true });
      await queryClient.cancelQueries();
      queryClient.clear();
    } catch {
      toastManager.add({
        title: "Couldn't reach server. Check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label="Open user menu" size="icon-lg" variant="ghost">
            <Avatar>
              {user.image ? <AvatarImage alt={user.name} src={user.image} /> : null}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          closeOnClick={false}
          disabled={isSigningOut}
          onClick={handleSignOut}
          variant="destructive"
        >
          <LogOutIcon />
          <span>{isSigningOut ? "Signing out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
