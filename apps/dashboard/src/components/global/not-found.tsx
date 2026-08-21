import { Button } from "@sycom-learn/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sycom-learn/ui/components/empty";
import { Link } from "@tanstack/react-router";
import { FileQuestionIcon } from "lucide-react";

export function NotFound() {
  return (
    <Empty className="min-h-[70svh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          That URL isn&apos;t a page on Sycom. Check the address, or go back home.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to="/" />}>Go home</Button>
      </EmptyContent>
    </Empty>
  );
}
