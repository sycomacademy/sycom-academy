import { Separator } from "@sycom-learn/ui/components/separator";
import { ScrollArea, ScrollBar } from "@sycom-learn/ui/components/scroll-area";
import { TooltipProvider } from "@sycom-learn/ui/components/tooltip";
import { ToolbarProvider } from "./toolbar-provider";
import { Editor } from "@tiptap/core";
import { UndoToolbar } from "./undo";
import { RedoToolbar } from "./redo";
import { HeadingsToolbar } from "./headings";
import { BlockquoteToolbar } from "./blockquote";
import { CodeToolbar } from "./code";
import { BoldToolbar } from "./bold";
import { ItalicToolbar } from "./italic";
import { UnderlineToolbar } from "./underline";
import { StrikeThroughToolbar } from "./strikethrough";
import { LinkToolbar } from "./link";
import { BulletListToolbar } from "./bullet-list";
import { OrderedListToolbar } from "./ordered-list";
import { HorizontalRuleToolbar } from "./horizontal-rule";
import { AlignmentTooolbar } from "./alignment";
import { MediaToolbar } from "./media";
import { QuestionToolbar } from "./question";
import { TableToolbar } from "./table";
import { ColorHighlightToolbar } from "./color-and-highlight";
import { SearchAndReplaceToolbar } from "./search-and-replace-toolbar";
import { CodeBlockToolbar } from "./code-block";
import { ExportToolbar } from "./export";
import { ImportToolbar } from "./import";
import { ViewOnlyToolbar } from "./view-only-toolbar";

export type EditorToolbarProps = {
  editor: Editor;
  /** When set, shows a trailing “View only” toggle that does not replace the consumer’s `editable` prop — combine in the parent. */
  viewOnlyToggle?: { viewOnly: boolean; onViewOnlyChange: (viewOnly: boolean) => void };
};

export const EditorToolbar = ({ editor, viewOnlyToggle }: EditorToolbarProps) => {
  return (
    <div className="sticky top-0 z-20 hidden w-full border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/75 sm:block">
      <ToolbarProvider editor={editor}>
        <TooltipProvider>
          <ScrollArea scrollbarGutter className="h-fit pt-2.5">
            <div>
              <div className="flex items-center gap-1 px-2">
                {/* History Group */}
                <UndoToolbar />
                <RedoToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                {/* Text Structure Group */}
                <HeadingsToolbar />
                <BlockquoteToolbar />
                <CodeToolbar />
                <CodeBlockToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                {/* Basic Formatting Group */}
                <BoldToolbar />
                <ItalicToolbar />
                <UnderlineToolbar />
                <StrikeThroughToolbar />
                <LinkToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                {/* Lists & Structure Group */}
                <BulletListToolbar />
                <OrderedListToolbar />
                <HorizontalRuleToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                {/* Alignment Group */}
                <AlignmentTooolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                {/* Media & Styling Group */}
                <MediaToolbar />
                <QuestionToolbar />
                <TableToolbar />
                <ColorHighlightToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />

                <div className="flex-1" />

                {/* Utility Group */}
                <SearchAndReplaceToolbar />
                <Separator orientation="vertical" className="mx-1 h-7" />
                <ImportToolbar />
                <ExportToolbar />
                {viewOnlyToggle ? (
                  <>
                    <Separator orientation="vertical" className="mx-1 h-7" />
                    <ViewOnlyToolbar
                      onViewOnlyChange={viewOnlyToggle.onViewOnlyChange}
                      viewOnly={viewOnlyToggle.viewOnly}
                    />
                  </>
                ) : null}
              </div>
            </div>
            <ScrollBar className="hidden" orientation="horizontal" />
          </ScrollArea>
        </TooltipProvider>
      </ToolbarProvider>
    </div>
  );
};
