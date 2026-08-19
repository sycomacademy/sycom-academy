import { Strikethrough } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const StrikeThroughToolbar = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Toggle>
>(({ className, onClick, children, ...props }, ref) => {
  const { editor } = useToolbar();
  const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("strike"));
  const canToggle = useToolbarEditorState((currentEditor) =>
    currentEditor.can().chain().focus().toggleStrike().run(),
  );
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Toggle
            size="sm"
            className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
            pressed={isActive}
            onClick={(e) => {
              editor?.chain().focus().toggleStrike().run();
              onClick?.(e);
            }}
            disabled={!canToggle}
            ref={ref}
            {...props}
          />
        }
      >
        {children ?? <Strikethrough className="h-4 w-4" />}
      </TooltipTrigger>
      <TooltipContent>
        <span>Strikethrough</span>
        <span className="text-gray-11 ml-1 text-xs">(cmd + shift + x)</span>
      </TooltipContent>
    </Tooltip>
  );
});

StrikeThroughToolbar.displayName = "StrikeThroughToolbar";

export { StrikeThroughToolbar };
