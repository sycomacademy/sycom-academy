import { Button } from "@sycom-learn/ui/components/button";
import { FileUploader } from "@sycom-learn/ui/components/file-uploader";
import { Input } from "@sycom-learn/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sycom-learn/ui/components/tabs";
import { NODE_HANDLES_SELECTED_STYLE_CLASSNAME, isValidUrl } from "@sycom-learn/ui/lib/tiptap-utils";
import type { TiptapEditorUploadFn } from "@sycom-learn/ui/lib/tiptap-upload";
import type { FileWithPreview } from "@sycom-learn/ui/hooks/use-file-upload";
import { useEditorEditable } from "@sycom-learn/ui/components/tiptap/use-editor-editable";
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Link, Upload, X } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { cn } from "@sycom-learn/ui/lib/utils";

export interface ImagePlaceholderOptions {
  HTMLAttributes: Record<string, unknown>;
  /** When set, file bytes are uploaded and `src` becomes the returned value (e.g. CDN public id). */
  onUpload?: TiptapEditorUploadFn;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imagePlaceholder: {
      /**
       * Inserts an image placeholder
       */
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
  name: "image-placeholder",

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
    return ReactNodeViewRenderer(ImagePlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertImagePlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "image-placeholder",
        });
      },
    };
  },
});

function fileBaseName(entry: FileWithPreview): string {
  const f = entry.file;
  return f instanceof File ? f.name : f.name;
}

function ImagePlaceholderComponent(props: NodeViewProps) {
  const { editor, selected, deleteNode, extension } = props;
  const onUpload = extension.options.onUpload as TiptapEditorUploadFn | undefined;
  const uploadInputId = useId();
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [pickedFile, setPickedFile] = useState<FileWithPreview | null>(null);

  const canEdit = useEditorEditable(editor);

  const handleInsertFromUpload = async () => {
    if (!pickedFile?.file) return;
    const file = pickedFile.file instanceof File ? pickedFile.file : null;
    if (!file) return;

    let src: string;
    let alt = altText;

    if (onUpload) {
      const result = await onUpload(file);
      src = result.src;
      alt = result.alt ?? (altText || fileBaseName(pickedFile));
    } else if (pickedFile.preview) {
      src = pickedFile.preview;
      alt = altText || fileBaseName(pickedFile);
    } else {
      return;
    }

    editor.chain().focus().setImage({ src, alt }).run();
    setPickedFile(null);
    setAltText("");
  };

  const handleInsertFromUrl = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url) {
      editor.chain().focus().setImage({ src: url, alt: altText }).run();
      setUrl("");
      setAltText("");
    }
  };

  return (
    <NodeViewWrapper className="flex w-full justify-center">
      <div
        className={cn(
          "w-full max-w-md border p-2 shadow-sm",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Add Image</h3>
          <Button type="button" variant="ghost" size="sm" onClick={deleteNode}>
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v === "url" ? "url" : "upload")}
          className="w-full"
        >
          <TabsList className="isolate grid w-full grid-cols-2">
            <TabsTrigger
              value="upload"
              className="relative z-10 bg-transparent data-active:bg-background data-active:shadow-sm/5 dark:data-active:bg-input"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger
              value="url"
              className="relative z-10 bg-transparent data-active:bg-background data-active:shadow-sm/5 dark:data-active:bg-input"
            >
              <Link className="mr-2 h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4 py-4">
              <FileUploader
                className="text-sm"
                accept="image/*"
                // keep in sync with MEDIA_LIMITS.image in @sycom-learn/storage
                maxSize={10 * 1024 * 1024}
                maxFileCount={1}
                multiple={false}
                disabled={!canEdit}
                inputId={uploadInputId}
                onFilesChange={(files) => setPickedFile(files[0] ?? null)}
              />
              <Input
                value={altText}
                size="sm"
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Alt text (optional)"
              />
              <Button
                type="button"
                className="w-full"
                size="sm"
                disabled={!pickedFile || (!onUpload && !pickedFile.preview) || !canEdit}
                onClick={() => void handleInsertFromUpload()}
              >
                Insert image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="url">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (urlError) setUrlError(false);
                  }}
                  placeholder="Enter image URL..."
                />
                {urlError && <p className="text-xs text-destructive">Please enter a valid URL</p>}
              </div>
              <div className="space-y-2">
                <Input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Alt text (optional)"
                />
              </div>
              <Button
                type="button"
                onClick={handleInsertFromUrl}
                className="w-full"
                disabled={!url || !canEdit}
              >
                Insert image
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </NodeViewWrapper>
  );
}
