import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEffect } from "react";

import { ScrollArea, ScrollBar } from "@sycom-learn/ui/components/scroll-area";
import { Separator } from "@sycom-learn/ui/components/separator";
import { TooltipProvider } from "@sycom-learn/ui/components/tooltip";
import { useMediaQuery } from "@sycom-learn/ui/hooks/use-media-query";

import { BoldToolbar } from "../toolbars/bold";
import { ItalicToolbar } from "../toolbars/italic";
import { UnderlineToolbar } from "../toolbars/underline";
import { LinkToolbar } from "../toolbars/link";
import { ColorHighlightToolbar } from "../toolbars/color-and-highlight";
import { ToolbarProvider } from "../toolbars/toolbar-provider";
import { HeadingsToolbar } from "../toolbars/headings";
import { BulletListToolbar } from "../toolbars/bullet-list";
import { OrderedListToolbar } from "../toolbars/ordered-list";
import { MediaToolbar } from "../toolbars/media";
import { TableToolbar } from "../toolbars/table";
import { AlignmentTooolbar } from "../toolbars/alignment";
import { BlockquoteToolbar } from "../toolbars/blockquote";

export function FloatingToolbar({ editor }: { editor: Editor | null }) {
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Prevent default context menu on mobile
  useEffect(() => {
    if (!(editor?.options.element instanceof Element) || !isMobile) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const el = editor.options.element;
    el.addEventListener("contextmenu", handleContextMenu);

    return () => el.removeEventListener("contextmenu", handleContextMenu);
  }, [editor, isMobile]);

  if (!editor) return null;

  if (isMobile) {
    return (
      <TooltipProvider>
        <BubbleMenu
          options={{
            placement: "bottom",
            offset: 10,
          }}
          shouldShow={({ editor: currentEditor }) =>
            currentEditor.isEditable && currentEditor.isFocused
          }
          editor={editor}
          className="mx-0 w-full min-w-full rounded-xl border border-border/80 bg-background/95 shadow-lg shadow-black/5 backdrop-blur-md dark:shadow-black/20"
        >
          <ToolbarProvider editor={editor}>
            <ScrollArea className="h-fit w-full py-0.5">
              <div className="flex items-center gap-0.5 px-2">
                <div className="flex items-center gap-0.5 p-1">
                  {/* Primary formatting */}
                  <BoldToolbar />
                  <ItalicToolbar />
                  <UnderlineToolbar />
                  <Separator orientation="vertical" className="mx-1 h-6" />

                  {/* Structure controls */}
                  <HeadingsToolbar />
                  <BulletListToolbar />
                  <OrderedListToolbar />
                  <Separator orientation="vertical" className="mx-1 h-6" />

                  {/* Rich formatting */}
                  <ColorHighlightToolbar />
                  <LinkToolbar />
                  <MediaToolbar />
                  <TableToolbar />
                  <Separator orientation="vertical" className="mx-1 h-6" />

                  {/* Additional controls */}
                  <AlignmentTooolbar />
                  <BlockquoteToolbar />
                </div>
              </div>
              <ScrollBar className="h-0.5" orientation="horizontal" />
            </ScrollArea>
          </ToolbarProvider>
        </BubbleMenu>
      </TooltipProvider>
    );
  }

  return null;
}
