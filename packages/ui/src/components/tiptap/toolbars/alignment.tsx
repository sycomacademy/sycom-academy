import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Check, ChevronDown } from "lucide-react";
import { useMediaQuery } from "@sycom-learn/ui/hooks/use-media-query";
import { MobileToolbarGroup, MobileToolbarItem } from "./mobile-toolbar-group";

import { Button } from "@sycom-learn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@sycom-learn/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

type TextAlignValue = "left" | "center" | "right" | "justify";

export const AlignmentTooolbar = () => {
  const { editor } = useToolbar();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const currentTextAlign = useToolbarEditorState((currentEditor) => {
    if (currentEditor.isActive({ textAlign: "center" })) {
      return "center" as const;
    }
    if (currentEditor.isActive({ textAlign: "right" })) {
      return "right" as const;
    }
    if (currentEditor.isActive({ textAlign: "justify" })) {
      return "justify" as const;
    }

    return "left" as const;
  });
  const canAlign = useToolbarEditorState((currentEditor) =>
    currentEditor.can().chain().focus().setTextAlign("left").run(),
  );

  const handleAlign = (value: TextAlignValue) => {
    editor?.chain().focus().setTextAlign(value).run();
  };

  const alignmentOptions = [
    {
      name: "Left Align",
      value: "left" as const,
      icon: <AlignLeft className="h-4 w-4" />,
    },
    {
      name: "Center Align",
      value: "center" as const,
      icon: <AlignCenter className="h-4 w-4" />,
    },
    {
      name: "Right Align",
      value: "right" as const,
      icon: <AlignRight className="h-4 w-4" />,
    },
    {
      name: "Justify Align",
      value: "justify" as const,
      icon: <AlignJustify className="h-4 w-4" />,
    },
  ];

  const findIndex = (value: TextAlignValue) => {
    return alignmentOptions.findIndex((option) => option.value === value);
  };

  if (isMobile) {
    return (
      <MobileToolbarGroup
        label={alignmentOptions[findIndex(currentTextAlign)]?.name ?? "Left Align"}
      >
        {alignmentOptions.map((option, index) => (
          <MobileToolbarItem
            key={index}
            onClick={() => handleAlign(option.value)}
            active={currentTextAlign === option.value}
          >
            <span className="mr-2">{option.icon}</span>
            {option.name}
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
              disabled={!canAlign}
              render={<Button variant="ghost" size="sm" className="h-8 w-max font-normal" />}
            />
          }
        >
          <span className="mr-2">{alignmentOptions[findIndex(currentTextAlign)]?.icon}</span>
          {alignmentOptions[findIndex(currentTextAlign)]?.name}
          <ChevronDown className="ml-2 h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Text Alignment</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        <DropdownMenuGroup className="w-40">
          {alignmentOptions.map((option, index) => (
            <DropdownMenuItem
              onClick={() => {
                handleAlign(option.value);
              }}
              key={index}
            >
              <span className="mr-2">{option.icon}</span>
              {option.name}

              {option.value === currentTextAlign && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
