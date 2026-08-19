import { BoldIcon } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
// import type { Extension } from "@tiptap/core";
// import type { StarterKitOptions } from "@tiptap/starter-kit";

// type StarterKitExtensions = Extension<StarterKitOptions>;

type ToggleProps = React.ComponentProps<typeof Toggle>;

const BoldToolbar = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("bold"));
    const canToggle = useToolbarEditorState((currentEditor) =>
      currentEditor.can().chain().focus().toggleBold().run(),
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
                editor?.chain().focus().toggleBold().run();
                onClick?.(e);
              }}
              disabled={!canToggle}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <BoldIcon className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Bold</span>
          <span className="text-gray-11 ml-1 text-xs">(cmd + b)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

BoldToolbar.displayName = "BoldToolbar";

export { BoldToolbar };
