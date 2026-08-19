import { Button } from "@sycom-learn/ui/components/button";
import { FileUploader } from "@sycom-learn/ui/components/file-uploader";
import { Input } from "@sycom-learn/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sycom-learn/ui/components/tabs";
import type { FileWithPreview } from "@sycom-learn/ui/hooks/use-file-upload";
import {
  NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
  isValidUrl,
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
import { Link, Play, Upload, X } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import type { TiptapEditorUploadFn } from "@sycom-learn/ui/lib/tiptap-upload";
import { cn } from "@sycom-learn/ui/lib/utils";

export interface VideoPlaceholderOptions {
  HTMLAttributes: Record<string, unknown>;
  onUpload?: TiptapEditorUploadFn;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoPlaceholder: {
      insertVideoPlaceholder: () => ReturnType;
    };
  }
}

export const VideoPlaceholder = Node.create<VideoPlaceholderOptions>({
  name: "video-placeholder",

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
    return ReactNodeViewRenderer(VideoPlaceholderComponent, {
      className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
    });
  },

  addCommands() {
    return {
      insertVideoPlaceholder: () => (props: CommandProps) => {
        return props.commands.insertContent({
          type: "video-placeholder",
        });
      },
    };
  },
});

function fileBaseName(entry: FileWithPreview): string {
  const f = entry.file;
  return f instanceof File ? f.name : f.name;
}

function getYouTubeEmbedUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (hostname === "youtube-nocookie.com") {
      if (parsedUrl.pathname.startsWith("/embed/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      if (parsedUrl.pathname === "/watch") {
        const videoId = parsedUrl.searchParams.get("v");
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/embed/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith("/shorts/")) {
        const videoId = parsedUrl.pathname.split("/")[2];
        return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function VideoPlaceholderComponent(props: NodeViewProps) {
  const { editor, selected, deleteNode, getPos, extension } = props;
  const onUpload = extension.options.onUpload as TiptapEditorUploadFn | undefined;
  const uploadInputId = useId();
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "youtube">("upload");
  const [url, setUrl] = useState("");
  const [youtubeUrl, setYouTubeUrl] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [urlError, setUrlError] = useState(false);
  const [youtubeUrlError, setYouTubeUrlError] = useState(false);
  const [pickedFile, setPickedFile] = useState<FileWithPreview | null>(null);

  const canEdit = useEditorEditable(editor);

  const insertVideo = (attrs: {
    src: string;
    poster: string | null;
    title: string;
    caption: string;
    aspectRatio?: number | null;
  }) => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    replaceNodeAtPosition(editor, pos, "video", {
      src: attrs.src,
      poster: attrs.poster,
      title: attrs.title,
      caption: attrs.caption,
      width: "100%",
      align: "center",
      aspectRatio: attrs.aspectRatio ?? null,
    });
    setPickedFile(null);
    setUrl("");
    setYouTubeUrl("");
    setPosterUrl("");
    setTitle("");
    setCaption("");
  };

  const handleInsertFromUpload = async (aspectRatio?: number | null) => {
    if (!pickedFile?.file) return;
    const file = pickedFile.file instanceof File ? pickedFile.file : null;
    if (!file) return;

    let src: string;
    if (onUpload) {
      const r = await onUpload(file);
      src = r.src;
    } else if (pickedFile.preview) {
      src = pickedFile.preview;
    } else {
      return;
    }

    insertVideo({
      src,
      poster: posterUrl.trim() && isValidUrl(posterUrl.trim()) ? posterUrl.trim() : null,
      title: title.trim() || fileBaseName(pickedFile),
      caption: caption.trim(),
      aspectRatio: aspectRatio ?? null,
    });
  };

  const handleInsertFromUrl = (e: FormEvent) => {
    e.preventDefault();
    const valid = isValidUrl(url);
    if (!valid) {
      setUrlError(true);
      return;
    }
    if (url) {
      insertVideo({
        src: url,
        poster: posterUrl.trim() && isValidUrl(posterUrl.trim()) ? posterUrl.trim() : null,
        title: title.trim(),
        caption: caption.trim(),
      });
    }
  };

  const handleInsertFromYouTube = (e: FormEvent) => {
    e.preventDefault();

    const embedUrl = getYouTubeEmbedUrl(youtubeUrl);
    if (!embedUrl) {
      setYouTubeUrlError(true);
      return;
    }

    insertVideo({
      src: embedUrl,
      poster: null,
      title: title.trim(),
      caption: caption.trim(),
      aspectRatio: 16 / 9,
    });
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
          <h3 className="text-lg font-semibold">Add video</h3>
          <Button type="button" variant="ghost" size="sm" onClick={deleteNode}>
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v === "url" || v === "youtube" ? v : "upload")}
          className="w-full"
        >
          <TabsList className="isolate grid w-full grid-cols-3">
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
            <TabsTrigger
              value="youtube"
              className="relative z-10 bg-transparent data-active:bg-background data-active:shadow-sm/5 dark:data-active:bg-input"
            >
              <Play className="mr-2 h-4 w-4" />
              YouTube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4 py-4">
              <FileUploader
                className="text-sm"
                accept="video/*"
                // keep in sync with MEDIA_LIMITS.video in @sycom-learn/storage
                maxSize={100 * 1024 * 1024}
                maxFileCount={1}
                multiple={false}
                disabled={!canEdit}
                inputId={uploadInputId}
                onFilesChange={(files) => setPickedFile(files[0] ?? null)}
              />
              <Input
                value={posterUrl}
                size="sm"
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Poster URL (optional)"
              />
              <Input
                value={title}
                size="sm"
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <Input
                value={caption}
                size="sm"
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              <Button
                type="button"
                className="w-full"
                size="sm"
                disabled={!pickedFile || (!onUpload && !pickedFile.preview) || !canEdit}
                onClick={() => void handleInsertFromUpload()}
              >
                Insert video
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
                  placeholder="Video URL (https://...)"
                />
                {urlError && <p className="text-xs text-destructive">Please enter a valid URL</p>}
              </div>
              <Input
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="Poster URL (optional)"
              />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              <Button
                type="button"
                onClick={handleInsertFromUrl}
                className="w-full"
                disabled={!url || !canEdit}
              >
                Insert video
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="youtube">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYouTubeUrl(e.target.value);
                    if (youtubeUrlError) setYouTubeUrlError(false);
                  }}
                  placeholder="YouTube URL (https://youtube.com/watch?... or youtu.be/...)"
                />
                {youtubeUrlError ? (
                  <p className="text-xs text-destructive">Please enter a valid YouTube URL</p>
                ) : null}
              </div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
              />
              <Button
                type="button"
                onClick={handleInsertFromYouTube}
                className="w-full"
                disabled={!youtubeUrl || !canEdit}
              >
                Insert YouTube video
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </NodeViewWrapper>
  );
}
