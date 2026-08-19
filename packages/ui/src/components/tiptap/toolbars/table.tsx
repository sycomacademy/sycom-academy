import { Button } from "@sycom-learn/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom-learn/ui/components/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { Table2 } from "lucide-react";
import { useState } from "react";

import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { TableGridPicker } from "./table-grid-picker";

export function TableToolbar() {
  const { editor } = useToolbar();
  const [open, setOpen] = useState(false);
  const canInsert = useToolbarEditorState((currentEditor) =>
    currentEditor
      .can()
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run(),
  );
  const editable = useToolbarEditorState((currentEditor) => currentEditor.isEditable);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (editable) setOpen(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              disabled={!editable || !canInsert}
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 w-max gap-1.5 px-2.5 font-normal")}
                  aria-label="Insert table"
                />
              }
            />
          }
        >
          <Table2 className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </TooltipTrigger>
        <TooltipContent>Insert table</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-auto p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Table size</p>
        <TableGridPicker
          onSelect={(rows, cols) => {
            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
