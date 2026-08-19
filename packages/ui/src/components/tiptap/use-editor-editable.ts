import { type Editor, useEditorState } from "@tiptap/react";

/** Subscribes node views and overlays to `editor.isEditable` updates (e.g. read-only toggles). */
export function useEditorEditable(editor: Editor): boolean {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => current.isEditable,
  });
}
