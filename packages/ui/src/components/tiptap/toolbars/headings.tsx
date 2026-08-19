import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@sycom-learn/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sycom-learn/ui/components/dropdown-menu";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { useMediaQuery } from "@sycom-learn/ui/hooks/use-media-query";
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group";

const levels = [1, 2, 3, 4] as const;

export const HeadingsToolbar = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { editor } = useToolbar();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const headingState = useToolbarEditorState((currentEditor) => ({
    isHeading: currentEditor.isActive("heading"),
    activeLevel: levels.find((level) => currentEditor.isActive("heading", { level })) ?? null,
  }));
  const activeLevel = headingState.activeLevel;

  if (isMobile) {
    return (
      <MobileToolbarGroup label={activeLevel ? `H${activeLevel}` : "Normal"}>
        <MobileToolbarItem
          onClick={() => editor?.chain().focus().setParagraph().run()}
          active={!headingState.isHeading}
        >
          Normal
        </MobileToolbarItem>
        {levels.map((level) => (
          <MobileToolbarItem
            key={level}
            onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
            active={activeLevel === level}
          >
            H{level}
          </MobileToolbarItem>
        ))}
      </MobileToolbarGroup>
    );
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-max gap-1 px-3 font-normal",
                    headingState.isHeading && "bg-accent text-accent-foreground",
                    className,
                  )}
                  ref={ref}
                  {...props}
                />
              }
            />
          }
        >
          {activeLevel ? `H${activeLevel}` : "Normal"}
          <ChevronDown className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>
          <span>Headings</span>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => editor?.chain().focus().setParagraph().run()}
          className={cn(
            "flex h-fit items-center gap-2",
            !headingState.isHeading && "bg-accent text-accent-foreground",
          )}
        >
          Normal
        </DropdownMenuItem>
        {levels.map((level) => (
          <DropdownMenuItem
            key={level}
            onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
            className={cn(
              "flex items-center gap-2",
              activeLevel === level && "bg-accent text-accent-foreground",
            )}
          >
            H{level}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

HeadingsToolbar.displayName = "HeadingsToolbar";
