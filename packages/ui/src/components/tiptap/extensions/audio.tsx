import type { NodeViewProps } from "@tiptap/react";
import {
  type CommandProps,
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
} from "@tiptap/react";
import { Edit, Link, MoreVertical, Trash, Upload } from "lucide-react";
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
  AudioPlayer,
  AudioPlayerContent,
  AudioPlayerControlBar,
  AudioPlayerMuteButton,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerVolumeRange,
} from "@sycom-learn/ui/components/kibo-ui/audio-player";
import { cn } from "@sycom-learn/ui/lib/utils";

function fileBaseName(entry: FileWithPreview): string {
  const f = entry.file;
  return f instanceof File ? f.name : f.name;
}

export type AudioAttrs = {
  src: string | null;
  title: string;
  caption: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audio: {
      insertAudio: (attrs: Partial<AudioAttrs>) => ReturnType;
    };
  }
}

export const AudioExtension = Node.create({
  name: "audioBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: "" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-tiptap-audio]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const figure = element as HTMLElement;
          const audio = figure.querySelector("audio");
          const caption = figure.querySelector("figcaption")?.textContent?.trim() ?? "";

          if (!audio) return false;

          return {
            src: audio.getAttribute("src"),
            title: audio.getAttribute("title") ?? "",
            caption,
          };
        },
      },
      {
        tag: "audio[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return false;
          const el = element as HTMLAudioElement;
          const caption =
            el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";

          return {
            src: el.getAttribute("src"),
            title: el.getAttribute("title") ?? "",
            caption,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = ((node.attrs.caption as string) ?? "").trim();
    const title = ((node.attrs.title as string) ?? "").trim();
    const audioSpec = [
      "audio",
      {
        src: node.attrs.src ?? undefined,
        controls: true,
        preload: "metadata",
        ...(title ? { title } : {}),
      },
    ] as const;
    if (caption) {
      return [
        "figure",
        mergeAttributes({ "data-tiptap-audio": "" }, HTMLAttributes),
        audioSpec,
        ["figcaption", {}, caption],
      ];
    }
    return ["figure", mergeAttributes({ "data-tiptap-audio": "" }, HTMLAttributes), audioSpec];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TiptapAudio);
  },

  addCommands() {
    return {
      insertAudio:
        (attrs) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: attrs.src ?? null,
              title: attrs.title ?? "",
              caption: attrs.caption ?? "",
            },
          });
        },
    };
  },
});

function TiptapAudio(props: NodeViewProps) {
  const { node, editor, selected, deleteNode, updateAttributes } = props;
  const replaceUploadInputId = useId();
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState((node.attrs.caption as string) || "");
  const [openedMore, setOpenedMore] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [pickedReplaceFile, setPickedReplaceFile] = useState<FileWithPreview | null>(null);
  const [replaceUploadKey, setReplaceUploadKey] = useState(0);
  const canEdit = useEditorEditable(editor);
  const src = (node.attrs.src as string) || "";
  const audioSrc = useMediaDeliveryUrl(src || null, "audio");

  const handleCaptionBlur = () => {
    updateAttributes({ caption });
    setEditingCaption(false);
  };

  const handleReplaceFromUpload = () => {
    if (!pickedReplaceFile?.preview) return;

    updateAttributes({
      src: pickedReplaceFile.preview,
      title: (node.attrs.title as string) || fileBaseName(pickedReplaceFile),
    });
    setPickedReplaceFile(null);
    setReplaceUploadKey((current) => current + 1);
    setOpenedMore(false);
  };

  const handleAudioUrlSubmit = () => {
    const nextUrl = audioUrl.trim();
    if (!nextUrl || !isValidUrl(nextUrl)) return;

    updateAttributes({ src: nextUrl });
    setAudioUrl("");
    setPickedReplaceFile(null);
    setReplaceUploadKey((current) => current + 1);
    setOpenedMore(false);
  };

  return (
    <NodeViewWrapper
      className={cn(
        "relative flex max-w-xl flex-col rounded-md border-2 border-transparent transition-all duration-200",
        selected ? "border-primary/50" : "",
      )}
    >
      <div className="group overflow-hidden rounded-lg border bg-card shadow-sm">
        {canEdit ? (
          <div className="flex justify-end border-b px-3 py-2">
            <div
              className="flex items-center gap-1 rounded-md border bg-background/80 p-1 backdrop-blur"
              data-open={openedMore || undefined}
            >
              <DropdownMenu onOpenChange={setOpenedMore} open={openedMore}>
                <DropdownMenuTrigger
                  render={<Button className="size-7" size="icon" variant="ghost" />}
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="mt-1 w-40 text-sm">
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
                          <p className="mb-2 text-xs font-medium">Upload Audio</p>
                          <FileUploader
                            accept="audio/*"
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
                              onChange={(event) => setAudioUrl(event.target.value)}
                              placeholder="Enter audio URL..."
                              value={audioUrl}
                            />
                            <Button
                              className="w-full"
                              disabled={!audioUrl.trim() || !isValidUrl(audioUrl.trim())}
                              onClick={handleAudioUrlSubmit}
                              size="sm"
                              type="button"
                            >
                              <Link className="mr-2 size-4" /> Replace with URL
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
                    <Trash className="mr-2 size-4" /> Delete Audio
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ) : null}
        <AudioPlayer className="w-full">
          <AudioPlayerContent src={audioSrc} preload="metadata" />
          <AudioPlayerControlBar className="flex flex-wrap items-center gap-0 bg-background/95">
            <AudioPlayerPlayButton />
            <AudioPlayerSeekBackwardButton />
            <AudioPlayerSeekForwardButton />
            <AudioPlayerTimeRange className="min-w-[120px] flex-1" />
            <AudioPlayerTimeDisplay showDuration />
            <AudioPlayerMuteButton />
            <AudioPlayerVolumeRange />
          </AudioPlayerControlBar>
        </AudioPlayer>

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
