import { Button, type ButtonProps } from "@sycom-learn/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { Undo2 } from "lucide-react";
import React from "react";

const UndoToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const canUndo = useToolbarEditorState((currentEditor) =>
      currentEditor.can().chain().focus().undo().run(),
    );

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
              onClick={(e) => {
                editor?.chain().focus().undo().run();
                onClick?.(e);
              }}
              disabled={!canUndo}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <Undo2 className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Undo</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

UndoToolbar.displayName = "UndoToolbar";

export { UndoToolbar };
