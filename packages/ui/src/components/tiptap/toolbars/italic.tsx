import { ItalicIcon } from "lucide-react";
import React from "react";

import { Toggle } from "@sycom-learn/ui/components/toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const ItalicToolbar = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Toggle>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const isActive = useToolbarEditorState((currentEditor) => currentEditor.isActive("italic"));
    const canToggle = useToolbarEditorState((currentEditor) =>
      currentEditor.can().chain().focus().toggleItalic().run(),
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
                editor?.chain().focus().toggleItalic().run();
                onClick?.(e);
              }}
              disabled={!canToggle}
              ref={ref}
              {...props}
            />
          }
        >
          {children ?? <ItalicIcon className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Italic</span>
          <span className="text-gray-11 ml-1 text-xs">(cmd + i)</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

ItalicToolbar.displayName = "ItalicToolbar";

export { ItalicToolbar };
