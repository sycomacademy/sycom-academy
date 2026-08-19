import { SeparatorHorizontal } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@sycom-learn/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const HorizontalRuleToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const { canInsert, isEditable } = useToolbarEditorState((currentEditor) => ({
      canInsert: currentEditor.can().chain().focus().setHorizontalRule().run(),
      isEditable: currentEditor.isEditable,
    }));

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0 sm:h-9 sm:w-9", className)}
              disabled={!isEditable || !canInsert}
              onClick={(e) => {
                editor?.chain().focus().setHorizontalRule().run();
                onClick?.(e);
              }}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <SeparatorHorizontal className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Horizontal Rule</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

HorizontalRuleToolbar.displayName = "HorizontalRuleToolbar";

export { HorizontalRuleToolbar };
