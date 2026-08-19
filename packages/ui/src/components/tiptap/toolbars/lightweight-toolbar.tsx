import { Separator } from "@sycom-learn/ui/components/separator";
import { ScrollArea, ScrollBar } from "@sycom-learn/ui/components/scroll-area";
import { TooltipProvider } from "@sycom-learn/ui/components/tooltip";
import { ToolbarProvider } from "./toolbar-provider";
import type { Editor } from "@tiptap/core";
import { UndoToolbar } from "./undo";
import { RedoToolbar } from "./redo";
import { HeadingsToolbar } from "./headings";
import { BlockquoteToolbar } from "./blockquote";
import { BoldToolbar } from "./bold";
import { ItalicToolbar } from "./italic";
import { UnderlineToolbar } from "./underline";
import { StrikeThroughToolbar } from "./strikethrough";
import { LinkToolbar } from "./link";
import { BulletListToolbar } from "./bullet-list";
import { OrderedListToolbar } from "./ordered-list";
import { HorizontalRuleToolbar } from "./horizontal-rule";
import { AlignmentTooolbar } from "./alignment";

export function LightweightEditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className="sticky top-0 z-20 hidden w-full border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/75 sm:block">
      <ToolbarProvider editor={editor}>
        <TooltipProvider>
          <ScrollArea className="h-fit">
            <div>
              <div className="flex items-center gap-1 px-2">
                <UndoToolbar />
                <RedoToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />
                <HeadingsToolbar />
                <BlockquoteToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />
                <BoldToolbar />
                <ItalicToolbar />
                <UnderlineToolbar />
                <StrikeThroughToolbar />
                <LinkToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />
                <BulletListToolbar />
                <OrderedListToolbar />
                <HorizontalRuleToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />
                <AlignmentTooolbar />
              </div>
            </div>
            <ScrollBar className="hidden" orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>
      </ToolbarProvider>
    </div>
  );
}
