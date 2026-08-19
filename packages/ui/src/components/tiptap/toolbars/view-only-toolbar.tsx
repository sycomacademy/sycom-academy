import { Eye } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { Toggle } from "@sycom-learn/ui/components/toggle";
import { cn } from "@sycom-learn/ui/lib/utils";

export type ViewOnlyToolbarProps = {
  viewOnly: boolean;
  onViewOnlyChange: (viewOnly: boolean) => void;
};

export function ViewOnlyToolbar({ viewOnly, onViewOnlyChange }: ViewOnlyToolbarProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            aria-label={viewOnly ? "Back to editing" : "View only"}
            className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9")}
            onPressedChange={onViewOnlyChange}
            pressed={viewOnly}
            size="sm"
          />
        }
      >
        <Eye className="size-4 shrink-0" />
      </TooltipTrigger>
      <TooltipContent>
        <span>{viewOnly ? "Back to editing" : "View only"}</span>
      </TooltipContent>
    </Tooltip>
  );
}
