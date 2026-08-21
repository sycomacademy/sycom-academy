import { Button } from "@sycom-learn/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sycom-learn/ui/components/empty";
import { Link, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";

export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const detail = error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <Empty className="min-h-[70svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          {import.meta.env.DEV
            ? detail
            : "Try again. If it keeps happening, go home and come back."}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={() => void router.invalidate()}>Try again</Button>
          <Button render={<Link to="/" />} variant="outline">
            Go home
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
