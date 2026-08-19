import type { NodeViewProps } from "@tiptap/react";
import {
  type CommandProps,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Edit, Link, MoreVertical, Play, Trash, Upload } from "lucide-react";
import { useId, useState } from "react";

import { useEditorEditable } from "@sycom-learn/ui/components/tiptap/use-editor-editable";
import { Button } from "@sycom-learn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@sycom-learn/ui/components/dropdown-menu";
import { FileUploader } from "@sycom-learn/ui/components/file-uploader";
import { Input } from "@sycom-learn/ui/components/input";
import type { FileWithPreview } from "@sycom-learn/ui/hooks/use-file-upload";
import { isValidUrl } from "@sycom-learn/ui/lib/tiptap-utils";
import { useMediaDeliveryUrl } from "@sycom-learn/ui/components/tiptap/use-media-delivery-url";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
} from "@sycom-learn/ui/components/kibo-ui/video-player";
import { cn } from "@sycom-learn/ui/lib/utils";

function fileBaseName(entry: FileWithPreview): string {
  const f = entry.file;
  return f instanceof File ? f.name : f.name;
}

function getYouTubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;

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

export type VideoAttrs = {
  src: string | null;
  poster: string | null;
  title: string;
  caption: string;
  width: string;
  align: "left" | "center" | "right";
  aspectRatio: number | null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      insertVideo: (attrs: Partial<VideoAttrs>) => ReturnType;
    };
  }
}

export const VideoExtension = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
      title: { default: "" },
      caption: { default: "" },
      width: { default: "100%" },
      align: { default: "center" },
      aspectRatio: { default: null as number | null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-tiptap-video]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const figure = element as HTMLElement;
          const video = figure.querySelector("video");
          const iframe = figure.querySelector("iframe");
          const caption = figure.querySelector("figcaption")?.textContent?.trim() ?? "";

          if (video) {
            return {
              src: video.getAttribute("src"),
              poster: video.getAttribute("poster"),
              title: video.getAttribute("title") ?? "",
              caption,
            };
          }

          if (iframe) {
            return {
              src: iframe.getAttribute("src"),
              poster: null,
              title: iframe.getAttribute("title") ?? "",
              caption,
              aspectRatio: 16 / 9,
            };
          }

          return false;
        },
      },
      {
        tag: "video[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLVideoElement;
          const caption =
            el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";

          return {
            src: el.getAttribute("src"),
            poster: el.getAttribute("poster"),
            title: el.getAttribute("title") ?? "",
            caption,
          };
        },
      },
      {
        tag: "iframe[src*='youtube.com'], iframe[src*='youtube-nocookie.com']",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLIFrameElement;
          const caption =
            el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";

          return {
            src: el.getAttribute("src"),
            poster: null,
            title: el.getAttribute("title") ?? "",
            caption,
            aspectRatio: 16 / 9,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = ((node.attrs.caption as string) ?? "").trim();
    const title = ((node.attrs.title as string) ?? "").trim();
    const embedUrl = getYouTubeEmbedUrl(node.attrs.src as string | null | undefined);
    const videoSpec = embedUrl
      ? ([
          "iframe",
          {
            src: embedUrl,
            title: title || "YouTube video",
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowfullscreen: "true",
            referrerpolicy: "strict-origin-when-cross-origin",
            style: `width:100%;aspect-ratio:${String(node.attrs.aspectRatio ?? 16 / 9)};`,
          },
        ] as const)
      : ([
          "video",
          {
            src: node.attrs.src ?? undefined,
            poster: node.attrs.poster ?? undefined,
            controls: true,
            preload: "metadata",
            style: `max-width:${node.attrs.width as string}`,
            ...(title ? { title } : {}),
          },
        ] as const);
    if (caption) {
      return [
        "figure",
        mergeAttributes({ "data-tiptap-video": "" }, HTMLAttributes),
        videoSpec,
        ["figcaption", {}, caption],
      ];
    }
    return ["figure", mergeAttributes({ "data-tiptap-video": "" }, HTMLAttributes), videoSpec];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TiptapVideo);
  },

  addCommands() {
    return {
      insertVideo:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              poster: attrs.poster ?? null,
              title: attrs.title ?? "",
              caption: attrs.caption ?? "",
              width: attrs.width ?? "100%",
              align: attrs.align ?? "center",
              aspectRatio: attrs.aspectRatio ?? null,
            },
          });
        },
    };
  },
});

function TiptapVideo(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const replaceUploadInputId = useId();
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState((node.attrs.caption as string) || "");
  const [openedMore, setOpenedMore] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pickedReplaceFile, setPickedReplaceFile] = useState<FileWithPreview | null>(null);
  const [replaceUploadKey, setReplaceUploadKey] = useState(0);
  const canEdit = useEditorEditable(editor);
  const title = (node.attrs.title as string) || "";
  const src = node.attrs.src as string | null;
  const embedUrl = getYouTubeEmbedUrl(src);
  const aspectRatio = Number(node.attrs.aspectRatio) || 16 / 9;
  const videoSrc = useMediaDeliveryUrl(embedUrl ? null : src, "video");
  const posterSrc = useMediaDeliveryUrl(node.attrs.poster as string | null, "image");

  const handleCaptionBlur = () => {
    updateAttributes({ caption });
    setEditingCaption(false);
  };

  const handleReplaceFromUpload = () => {
    if (!pickedReplaceFile?.preview) return;

    updateAttributes({
      src: pickedReplaceFile.preview,
      poster: null,
      title: title || fileBaseName(pickedReplaceFile),
      aspectRatio: null,
    });
    setPickedReplaceFile(null);
    setReplaceUploadKey((current) => current + 1);
    setOpenedMore(false);
  };

  const handleVideoUrlSubmit = () => {
    const nextUrl = videoUrl.trim();
    if (!nextUrl || !isValidUrl(nextUrl)) return;

    updateAttributes({
      src: nextUrl,
      poster: null,
      aspectRatio: null,
    });
    setVideoUrl("");
    setPickedReplaceFile(null);
    setReplaceUploadKey((current) => current + 1);
    setOpenedMore(false);
  };

  const handleYoutubeUrlSubmit = () => {
    const nextUrl = youtubeUrl.trim();
    const nextEmbedUrl = getYouTubeEmbedUrl(nextUrl);
    if (!nextEmbedUrl) return;

    updateAttributes({
      src: nextEmbedUrl,
      poster: null,
      aspectRatio: 16 / 9,
    });
    setYoutubeUrl("");
    setPickedReplaceFile(null);
    setReplaceUploadKey((current) => current + 1);
    setOpenedMore(false);
  };

  return (
    <NodeViewWrapper
      className={cn(
        "relative flex flex-col rounded-md border-2 border-transparent transition-all duration-200",
        selected ? "border-primary/50" : "",
      )}
      style={{ width: node.attrs.width as string }}
    >
      <div className="group relative overflow-hidden rounded-lg border bg-card shadow-sm">
        {embedUrl ? (
          <div className="bg-black">
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              aria-label={title || "YouTube video"}
              className="w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              src={embedUrl}
              style={{ aspectRatio: String(aspectRatio) }}
              title="YouTube video player"
            />
          </div>
        ) : (
          <VideoPlayer className="w-full">
            <VideoPlayerContent
              src={videoSrc}
              poster={posterSrc}
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                  updateAttributes({
                    aspectRatio: video.videoWidth / video.videoHeight,
                  });
                }
              }}
            />
            <VideoPlayerControlBar className="flex flex-wrap items-center gap-0 bg-background/95">
              <VideoPlayerPlayButton />
              <VideoPlayerSeekBackwardButton />
              <VideoPlayerSeekForwardButton />
              <VideoPlayerTimeRange className="min-w-[120px] flex-1" />
              <VideoPlayerTimeDisplay showDuration />
              <VideoPlayerMuteButton />
              <VideoPlayerVolumeRange />
            </VideoPlayerControlBar>
          </VideoPlayer>
        )}

        {canEdit ? (
          <div
            className={cn(
              "absolute top-4 right-4 flex items-center gap-1 rounded-md border bg-background/80 p-1 opacity-0 backdrop-blur transition-opacity",
              "group-hover:opacity-100",
              openedMore && "opacity-100",
            )}
          >
            <DropdownMenu onOpenChange={setOpenedMore} open={openedMore}>
              <DropdownMenuTrigger
                render={<Button className="size-7" size="icon" variant="ghost" />}
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" alignOffset={-90} className="mt-1 w-40 text-sm">
                <DropdownMenuItem onClick={() => setEditingCaption(true)}>
                  <Edit className="mr-2 size-4" /> Edit Caption
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Upload className="mr-2 size-4" /> Change Source
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-fit min-w-52 p-2">
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-medium">Upload Video</p>
                        <FileUploader
                          accept="video/*"
                          className="text-xs"
                          disabled={!canEdit}
                          inputId={replaceUploadInputId}
                          key={replaceUploadKey}
                          maxFileCount={1}
                          multiple={false}
                          onFilesChange={(files) => setPickedReplaceFile(files[0] ?? null)}
                        />
                        <Button
                          className="mt-2 w-full"
                          disabled={!pickedReplaceFile?.preview || !canEdit}
                          onClick={handleReplaceFromUpload}
                          size="sm"
                          type="button"
                        >
                          Replace with upload
                        </Button>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium">Or use URL</p>
                        <div className="space-y-2">
                          <Input
                            className="text-xs"
                            onChange={(event) => setVideoUrl(event.target.value)}
                            placeholder="Enter video URL..."
                            value={videoUrl}
                          />
                          <Button
                            className="w-full"
                            disabled={!videoUrl.trim() || !isValidUrl(videoUrl.trim())}
                            onClick={handleVideoUrlSubmit}
                            size="sm"
                            type="button"
                          >
                            <Link className="mr-2 size-4" /> Replace with URL
                          </Button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium">YouTube</p>
                        <div className="space-y-2">
                          <Input
                            className="text-xs"
                            onChange={(event) => setYoutubeUrl(event.target.value)}
                            placeholder="Paste a YouTube URL..."
                            value={youtubeUrl}
                          />
                          <Button
                            className="w-full"
                            disabled={!getYouTubeEmbedUrl(youtubeUrl.trim())}
                            onClick={handleYoutubeUrlSubmit}
                            size="sm"
                            type="button"
                          >
                            <Play className="mr-2 size-4" /> Replace with YouTube
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={deleteNode}
                >
                  <Trash className="mr-2 size-4" /> Delete Video
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {canEdit ? (
          editingCaption ? (
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={handleCaptionBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCaptionBlur();
                }
              }}
              className="rounded-none border-0 border-t text-center text-sm"
              placeholder="Add a caption..."
            />
          ) : (
            <button
              type="button"
              className="w-full cursor-text border-t py-2 text-center text-sm text-muted-foreground"
              onClick={() => setEditingCaption(true)}
            >
              {caption || "Add a caption..."}
            </button>
          )
        ) : caption ? (
          <p className="border-t py-2 text-center text-sm text-muted-foreground">{caption}</p>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}
