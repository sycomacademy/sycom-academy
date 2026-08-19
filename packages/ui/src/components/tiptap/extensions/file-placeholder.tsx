import { Button } from "@sycom-learn/ui/components/button";
import { FileUploader } from "@sycom-learn/ui/components/file-uploader";
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  replaceNodeAtPosition,
} from "@sycom-learn/ui/lib/tiptap-utils";
import { useEditorEditable } from "@sycom-learn/ui/components/tiptap/use-editor-editable";
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { X } from "lucide-react";
import { useId, useState } from "react";
import type { FileWithPreview } from "@sycom-learn/ui/hooks/use-file-upload";
import type { TiptapEditorUploadFn } from "@sycom-learn/ui/lib/tiptap-upload";
import { cn } from "@sycom-learn/ui/lib/utils";

export interface FilePlaceholderOptions {
  HTMLAttributes: Record<string, unknown>;
  onUpload?: TiptapEditorUploadFn;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    filePlaceholder: {
      insertFilePlaceholder: () => ReturnType;
    };
  }
}

export const FilePlaceholder = Node.create<FilePlaceholderOptions>({
  name: "file-placeholder",

  addOptions() {
    return {
      HTMLAttributes: {},
      onUpload: undefined as TiptapEditorUploadFn | undefined,
    };
  },

  group: "block",

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FilePlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertFilePlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "file-placeholder",
        });
      },
    };
  },
});

function fileMeta(entry: FileWithPreview): { name: string; size: number; mime: string } {
  const f = entry.file;
  if (f instanceof File) {
    return {
      name: f.name,
      size: f.size,
      mime: f.type || "application/octet-stream",
    };
  }
  return { name: f.name, size: f.size, mime: f.type || "application/octet-stream" };
}

function FilePlaceholderComponent(props: NodeViewProps) {
  const { editor, selected, deleteNode, getPos, extension } = props;
  const onUpload = extension.options.onUpload as TiptapEditorUploadFn | undefined;
  const uploadInputId = useId();
  const [pickedFile, setPickedFile] = useState<FileWithPreview | null>(null);

  const canEdit = useEditorEditable(editor);

  const handleInsert = async () => {
    if (!pickedFile?.file) return;
    const file = pickedFile.file instanceof File ? pickedFile.file : null;
    if (!file) return;

    const { name, size, mime } = fileMeta(pickedFile);
    const pos = getPos();
    if (typeof pos !== "number") return;

    let src: string;
    let resourceType: "image" | "video" | "audio" | "file" = "file";
    let format: string | null = null;
    if (onUpload) {
      const result = await onUpload(file);
      src = result.src;
      if (result.resourceType) resourceType = result.resourceType;
      format = result.format ?? null;
    } else if (pickedFile.preview) {
      src = pickedFile.preview;
    } else {
      return;
    }

    replaceNodeAtPosition(editor, pos, "fileAttachment", {
      src,
      name,
      mimeType: mime,
      size,
      resourceType,
      format,
    });
    setPickedFile(null);
  };

  return (
    <NodeViewWrapper className="flex w-full justify-center" data-drag-handle="">
      <div
        className={cn(
          "w-full max-w-md border p-2 shadow-sm",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Add file</h3>
          <Button type="button" variant="ghost" size="sm" onClick={deleteNode}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 py-2">
          <FileUploader
            accept="
              application/pdf,
              application/msword,
              application/vnd.openxmlformats-officedocument.wordprocessingml.document,
              application/vnd.ms-excel,
              application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
              application/vnd.ms-powerpoint,
              application/vnd.openxmlformats-officedocument.presentationml.presentation,
              text/plain,
              text/csv,
              application/zip,
              application/x-7z-compressed,
              application/x-rar-compressed,
              application/x-tar,
              application/x-gzip
            "
            className="text-sm"
            // keep in sync with MEDIA_LIMITS.file in @sycom-learn/storage
            maxSize={50 * 1024 * 1024}
            maxFileCount={1}
            multiple={false}
            disabled={!canEdit}
            inputId={uploadInputId}
            onFilesChange={(files) => setPickedFile(files[0] ?? null)}
          />

          <Button
            type="button"
            className="w-full"
            size="sm"
            disabled={!pickedFile || (!onUpload && !pickedFile.preview) || !canEdit}
            onClick={() => void handleInsert()}
          >
            Insert file
          </Button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
