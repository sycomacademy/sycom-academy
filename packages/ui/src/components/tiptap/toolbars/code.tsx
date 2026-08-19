import { Code2 } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const CodeToolbar = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Toggle>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("code"));
    const canToggle = useToolbarEditorState((currentEditor) =>
      currentEditor.can().chain().focus().toggleCode().run(),
    );
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Toggle
              size="sm"
              className={cn("h-8 w-8 p-0 font-mono sm:h-9 sm:w-9", className)}
              pressed={isActive}
              onClick={(e) => {
                editor?.chain().focus().toggleCode().run();
                onClick?.(e);
              }}
              disabled={!canToggle}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <Code2 className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Code</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

CodeToolbar.displayName = "CodeToolbar";

export { CodeToolbar };
