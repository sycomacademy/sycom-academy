import { Code } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const CodeBlockToolbar = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Toggle>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const { isActive, isEditable } = useToolbarEditorState((currentEditor) => ({
      isActive: currentEditor.isActive("codeBlock"),
      isEditable: currentEditor.isEditable,
    }));
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              size="sm"
              className={cn("h-8 w-8 p-0 font-mono sm:h-9 sm:w-9", className)}
              pressed={isActive}
              onClick={(e) => {
                editor?.chain().focus().toggleCodeBlock().run();
                onClick?.(e);
              }}
              disabled={!isEditable}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <Code className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Code Block</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

CodeBlockToolbar.displayName = "CodeBlockToolbar";

export { CodeBlockToolbar };
