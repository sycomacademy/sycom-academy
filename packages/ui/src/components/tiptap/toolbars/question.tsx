import { CircleHelp } from "lucide-react";
import React from "react";

import { Button, type ButtonProps } from "@sycom-learn/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

const QuestionToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, onClick, children, ...props }, ref) => {
    const { editor } = useToolbar();
    const { canInsert, isEditable } = useToolbarEditorState((currentEditor) => ({
      canInsert: currentEditor.can().chain().focus().insertLessonQuestion().run(),
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
                editor?.chain().focus().insertLessonQuestion().run();
                onClick?.(e);
              }}
              ref={ref}
              aria-label="Insert question"
              {...props}
            />
          }
        >
          {children ?? <CircleHelp className="h-4 w-4" />}
        </TooltipTrigger>
        <TooltipContent>
          <span>Question</span>
        </TooltipContent>
      </Tooltip>
    );
  },
);

QuestionToolbar.displayName = "QuestionToolbar";

export { QuestionToolbar };
