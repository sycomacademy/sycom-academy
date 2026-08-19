import { type Editor } from "@tiptap/core";

export const NODE_HANDLES_SELECTED_STYLE_CLASSNAME = "node-handles-selected-style";

export function isValidUrl(url: string) {
  return /^https?:\/\/\S+$/.test(url);
}

export const duplicateContent = (editor: Editor) => {
  const { view } = editor;
  const { state } = view;
  const { selection } = state;

  editor
    .chain()
    .insertContentAt(
      selection.to,
      /* eslint-disable */
      // @ts-nocheck
      selection.content().content.firstChild?.toJSON(),
      {
        updateSelection: true,
      },
    )
    .focus(selection.to)
    .run();
};

export function getUrlFromString(str: string) {
  if (isValidUrl(str)) {
    return str;
  }
  try {
    if (str.includes(".") && !str.includes(" ")) {
      return new URL(`https://${str}`).toString();
    }
  } catch {
    return null;
  }
}

export function absoluteUrl(path: string) {
  return `${process.env.VITE_APP_URL}${path}`;
}

/** Replace the block at `pos` with a new node of `nodeTypeName` (same depth / size contract as TipTap placeholders). */
export function replaceNodeAtPosition(
  editor: Editor,
  pos: number,
  nodeTypeName: string,
  attrs: Record<string, unknown>,
): boolean {
  const { state } = editor;
  const nodeType = state.schema.nodes[nodeTypeName];
  if (!nodeType) return false;
  const current = state.doc.nodeAt(pos);
  if (!current) return false;
  const next = nodeType.create(attrs);
  const tr = state.tr.replaceWith(pos, pos + current.nodeSize, next);
  editor.view.dispatch(tr);
  return true;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
