import type { ReactNode } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BetweenHorizontalEnd,
  Combine,
  Columns,
  Rows,
  Scissors,
  Table2,
  Trash2,
} from "lucide-react";

import { Button } from "@sycom-learn/ui/components/button";
import { Separator } from "@sycom-learn/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";

type TableBubbleMenuProps = {
  editor: Editor | null;
};

function useTableBubbleCapabilities(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      addRowBefore: ed.can().chain().focus().addRowBefore().run(),
      addRowAfter: ed.can().chain().focus().addRowAfter().run(),
      addColumnBefore: ed.can().chain().focus().addColumnBefore().run(),
      addColumnAfter: ed.can().chain().focus().addColumnAfter().run(),
      toggleHeaderRow: ed.can().chain().focus().toggleHeaderRow().run(),
      toggleHeaderColumn: ed.can().chain().focus().toggleHeaderColumn().run(),
      mergeCells: ed.can().chain().focus().mergeCells().run(),
      splitCell: ed.can().chain().focus().splitCell().run(),
      deleteRow: ed.can().chain().focus().deleteRow().run(),
      deleteColumn: ed.can().chain().focus().deleteColumn().run(),
      deleteTable: ed.can().chain().focus().deleteTable().run(),
    }),
  });
}

function TableBubbleMenuToolbar({ editor }: { editor: Editor }) {
  const cap = useTableBubbleCapabilities(editor);

  return (
    <>
      <TableActionButton
        label="Add row above"
        disabled={!cap.addRowBefore}
        onClick={() => editor.chain().focus().addRowBefore().run()}
        icon={<ArrowUp className="size-4" />}
      />
      <TableActionButton
        label="Add row below"
        disabled={!cap.addRowAfter}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        icon={<ArrowDown className="size-4" />}
      />
      <TableActionButton
        label="Add column before"
        disabled={!cap.addColumnBefore}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        icon={<ArrowLeft className="size-4" />}
      />
      <TableActionButton
        label="Add column after"
        disabled={!cap.addColumnAfter}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        icon={<ArrowRight className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-0.5 h-7" />

      <TableActionButton
        label="Toggle header row"
        disabled={!cap.toggleHeaderRow}
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        icon={<Rows className="size-4" />}
      />
      <TableActionButton
        label="Toggle header column"
        disabled={!cap.toggleHeaderColumn}
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
        icon={<Columns className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-0.5 h-7" />

      <TableActionButton
        label="Merge cells"
        disabled={!cap.mergeCells}
        onClick={() => editor.chain().focus().mergeCells().run()}
        icon={<Combine className="size-4" />}
      />
      <TableActionButton
        label="Split cell"
        disabled={!cap.splitCell}
        onClick={() => editor.chain().focus().splitCell().run()}
        icon={<Scissors className="size-4" />}
      />

      <Separator orientation="vertical" className="mx-0.5 h-7" />

      <TableActionButton
        label="Delete row"
        disabled={!cap.deleteRow}
        onClick={() => editor.chain().focus().deleteRow().run()}
        icon={<Trash2 className="size-4" />}
      />
      <TableActionButton
        label="Delete column"
        disabled={!cap.deleteColumn}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        icon={<BetweenHorizontalEnd className="size-4" />}
      />
      <TableActionButton
        label="Delete table"
        disabled={!cap.deleteTable}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => editor.chain().focus().deleteTable().run()}
        icon={<Table2 className="size-4" />}
      />
    </>
  );
}

function TableActionButton({
  label,
  onClick,
  disabled,
  icon,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("size-8 shrink-0", className)}
            disabled={disabled}
            aria-label={label}
            onClick={onClick}
          />
        }
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function TableBubbleMenu({ editor }: TableBubbleMenuProps) {
  if (!editor) return null;

  return (
    <TooltipProvider>
      <BubbleMenu
        editor={editor}
        options={{
          placement: "top",
          offset: 8,
        }}
        shouldShow={({ editor: ed }) => ed.isEditable && ed.isActive("table")}
        className="z-50 flex max-w-[min(100vw-2rem,28rem)] flex-wrap items-center gap-0.5 rounded-xl border border-border/80 bg-background/95 p-1 shadow-lg ring-1 shadow-black/5 ring-black/5 backdrop-blur-md dark:shadow-black/20 dark:ring-white/10"
      >
        <TableBubbleMenuToolbar editor={editor} />
      </BubbleMenu>
    </TooltipProvider>
  );
}
