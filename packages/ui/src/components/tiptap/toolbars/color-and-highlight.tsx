/* eslint-disable */
// @ts-nocheck
import { Button } from "@sycom-learn/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom-learn/ui/components/popover";
import { ScrollArea } from "@sycom-learn/ui/components/scroll-area";
import { Separator } from "@sycom-learn/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMediaQuery } from "@sycom-learn/ui/hooks/use-media-query";
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group";

const TEXT_COLORS = [
  { name: "Default", color: "var(--editor-text-default)" },
  { name: "Gray", color: "var(--editor-text-gray)" },
  { name: "Brown", color: "var(--editor-text-brown)" },
  { name: "Orange", color: "var(--editor-text-orange)" },
  { name: "Yellow", color: "var(--editor-text-yellow)" },
  { name: "Green", color: "var(--editor-text-green)" },
  { name: "Blue", color: "var(--editor-text-blue)" },
  { name: "Purple", color: "var(--editor-text-purple)" },
  { name: "Pink", color: "var(--editor-text-pink)" },
  { name: "Red", color: "var(--editor-text-red)" },
];

const HIGHLIGHT_COLORS = [
  { name: "Default", color: "var(--editor-highlight-default)" },
  { name: "Gray", color: "var(--editor-highlight-gray)" },
  { name: "Brown", color: "var(--editor-highlight-brown)" },
  { name: "Orange", color: "var(--editor-highlight-orange)" },
  { name: "Yellow", color: "var(--editor-highlight-yellow)" },
  { name: "Green", color: "var(--editor-highlight-green)" },
  { name: "Blue", color: "var(--editor-highlight-blue)" },
  { name: "Purple", color: "var(--editor-highlight-purple)" },
  { name: "Pink", color: "var(--editor-highlight-pink)" },
  { name: "Red", color: "var(--editor-highlight-red)" },
];

interface ColorHighlightButtonProps {
  name: string;
  color: string;
  isActive: boolean;
  onClick: () => void;
  isHighlight?: boolean;
}

const ColorHighlightButton = ({
  name,
  color,
  isActive,
  onClick,
  isHighlight,
}: ColorHighlightButtonProps) => (
  <button
    onClick={onClick}
    className="hover:bg-gray-3 flex w-full items-center justify-between rounded-sm px-2 py-1 text-sm"
    type="button"
  >
    <div className="flex items-center space-x-2">
      <div
        className="rounded-sm border px-1 py-px font-medium"
        style={isHighlight ? { backgroundColor: color } : { color }}
      >
        A
      </div>
      <span>{name}</span>
    </div>
    {isActive && <CheckIcon className="h-4 w-4" />}
  </button>
);

export const ColorHighlightToolbar = () => {
  const { editor } = useToolbar();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const textStyleState = useToolbarEditorState((currentEditor) => ({
    currentColor: currentEditor.getAttributes("textStyle").color as string | undefined,
    currentHighlight: currentEditor.getAttributes("highlight").color as string | undefined,
    canStyle:
      currentEditor.isEditable &&
      currentEditor.can().chain().focus().setHighlight({ color: "" }).run() &&
      currentEditor.can().chain().focus().setColor("").run(),
  }));
  const currentColor = textStyleState.currentColor;
  const currentHighlight = textStyleState.currentHighlight;

  const handleSetColor = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setColor(color === currentColor ? "" : color)
      .run();
  };

  const handleSetHighlight = (color: string) => {
    editor
      ?.chain()
      .focus()
      .setHighlight(color === currentHighlight ? { color: "" } : { color })
      .run();
  };

  const isDisabled = !textStyleState.canStyle;

  if (isMobile) {
    return (
      <div className="flex gap-1">
        <MobileToolbarGroup label="Color">
          {TEXT_COLORS.map(({ name, color }) => (
            <MobileToolbarItem
              key={name}
              onClick={() => handleSetColor(color)}
              active={currentColor === color}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-sm border px-2" style={{ color }}>
                  A
                </div>
                <span>{name}</span>
              </div>
            </MobileToolbarItem>
          ))}
        </MobileToolbarGroup>

        <MobileToolbarGroup label="Highlight">
          {HIGHLIGHT_COLORS.map(({ name, color }) => (
            <MobileToolbarItem
              key={name}
              onClick={() => handleSetHighlight(color)}
              active={currentHighlight === color}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-sm border px-2" style={{ backgroundColor: color }}>
                  A
                </div>
                <span>{name}</span>
              </div>
            </MobileToolbarItem>
          ))}
        </MobileToolbarGroup>
      </div>
    );
  }

  return (
    <Popover>
      <div className="relative h-full">
        <Tooltip>
          <TooltipTrigger
            render={
              <PopoverTrigger
                disabled={isDisabled}
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{
                      color: currentColor,
                    }}
                    className={cn("h-8 w-14 p-0 font-normal")}
                  />
                }
              />
            }
          >
            <span className="text-md">A</span>
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>Text Color & Highlight</TooltipContent>
        </Tooltip>

        <PopoverContent align="start" className="dark:bg-gray-2 w-56">
          <ScrollArea className="max-h-80 overflow-y-auto pr-2">
            <div className="text-gray-11 mt-2 mb-2.5 px-2 text-xs">Color</div>
            {TEXT_COLORS.map(({ name, color }) => (
              <ColorHighlightButton
                key={name}
                name={name}
                color={color}
                isActive={currentColor === color}
                onClick={() => handleSetColor(color)}
              />
            ))}

            <Separator className="my-3" />

            <div className="text-gray-11 mb-2.5 w-full px-2 pr-3 text-xs">Background</div>
            {HIGHLIGHT_COLORS.map(({ name, color }) => (
              <ColorHighlightButton
                key={name}
                name={name}
                color={color}
                isActive={currentHighlight === color}
                onClick={() => handleSetHighlight(color)}
                isHighlight
              />
            ))}
          </ScrollArea>
        </PopoverContent>
      </div>
    </Popover>
  );
};
