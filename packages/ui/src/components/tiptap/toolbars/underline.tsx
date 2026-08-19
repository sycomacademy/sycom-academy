import { UnderlineIcon } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const UnderlineToolbar = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Toggle>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("underline"));
    const canToggle = useToolbarEditorState((currentEditor) =>
      currentEditor.can().chain().focus().toggleUnderline().run(),
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
                editor?.chain().focus().toggleUnderline().run();
                onClick?.(e);
              }}
              disabled={!canToggle}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <UnderlineIcon className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Underline</span>
          <span className="text-gray-11 ml-1 text-xs">(cmd + u)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

UnderlineToolbar.displayName = "UnderlineToolbar";

export { UnderlineToolbar };
