import { TableKit } from "@tiptap/extension-table/kit";

/**
 * Bundles Table, TableRow, TableHeader, and TableCell. Resizable columns use
 * {@link https://tiptap.dev/docs/editor/extensions/nodes/table | Table} + `.column-resize-handle` in tiptap.css.
 */
export const TableExtension = TableKit.configure({
  table: {
    resizable: true,
    lastColumnResizable: true,
    allowTableNodeSelection: true,
  },
});
