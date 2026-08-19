import { Button } from "@sycom-learn/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@sycom-learn/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import {
  AudioLines,
  ChevronDown,
  Image as ImageIcon,
  Paperclip,
  Video as VideoIcon,
} from "lucide-react";

import { useToolbar, useToolbarEditorState } from "./toolbar-provider";

export function MediaToolbar() {
  const { editor } = useToolbar();
  const state = useToolbarEditorState((currentEditor) => ({
    canImage: currentEditor.can().chain().focus().insertImagePlaceholder().run(),
    canVideo: currentEditor.can().chain().focus().insertVideoPlaceholder().run(),
    canAudio: currentEditor.can().chain().focus().insertAudioPlaceholder().run(),
    canFile: currentEditor.can().chain().focus().insertFilePlaceholder().run(),
    editable: currentEditor.isEditable,
  }));

  const canAny =
    state.editable && (state.canImage || state.canVideo || state.canAudio || state.canFile);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              disabled={!canAny}
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-max gap-1 px-3 font-normal"
                  aria-label="Insert media"
                />
              }
            />
          }
        >
          Media
          <ChevronDown className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Image, video, audio, or file</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Insert</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!state.canImage}
            onClick={() => editor?.chain().focus().insertImagePlaceholder().run()}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!state.canVideo}
            onClick={() => editor?.chain().focus().insertVideoPlaceholder().run()}
            className="flex items-center gap-2"
          >
            <VideoIcon className="h-4 w-4" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!state.canAudio}
            onClick={() => editor?.chain().focus().insertAudioPlaceholder().run()}
            className="flex items-center gap-2"
          >
            <AudioLines className="h-4 w-4" />
            Audio
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!state.canFile}
            onClick={() => editor?.chain().focus().insertFilePlaceholder().run()}
            className="flex items-center gap-2"
          >
            <Paperclip className="h-4 w-4" />
            File
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
