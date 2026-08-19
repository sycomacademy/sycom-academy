import { ArrowLeftIcon, CameraIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@sycom-learn/ui/components/avatar";
import { Button } from "@sycom-learn/ui/components/button";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "@sycom-learn/ui/components/cropper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sycom-learn/ui/components/dialog";
import { Slider } from "@sycom-learn/ui/components/slider";
import { useFileUpload } from "@sycom-learn/ui/hooks/use-file-upload";
import { buildImageUrl } from "@sycom-learn/ui/image/cdn";
import { getInitials } from "@sycom-learn/ui/lib/string";

type Area = { x: number; y: number; width: number; height: number };

const AVATAR_OUTPUT_PX = 512;

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputPx: number,
): Promise<Blob | null> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = outputPx;
  canvas.height = outputPx;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputPx,
    outputPx,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

export interface AvatarUploaderProps {
  name: string;
  currentImagePublicId?: string | null;
  isUploading?: boolean;
  outputPx?: number;
  onCropComplete: (blob: Blob, fileName: string) => void | Promise<void>;
}

export function AvatarUploader({
  name,
  currentImagePublicId,
  isUploading = false,
  outputPx = AVATAR_OUTPUT_PX,
  onCropComplete,
}: AvatarUploaderProps) {
  const [
    { files, isDragging },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({ accept: "image/*" });

  const previewUrl = files[0]?.preview ?? null;
  const fileId = files[0]?.id;

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const previousFileIdRef = useRef<string | undefined | null>(null);

  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels);
  }, []);

  useEffect(() => {
    if (fileId && fileId !== previousFileIdRef.current) {
      setIsDialogOpen(true);
      setCroppedAreaPixels(null);
      setZoom(1);
    }
    previousFileIdRef.current = fileId;
  }, [fileId]);

  const handleDialogChange = (next: boolean) => {
    if (isUploading) return;
    setIsDialogOpen(next);
    if (!next && fileId) {
      removeFile(fileId);
      setCroppedAreaPixels(null);
    }
  };

  const handleSave = async () => {
    if (!previewUrl || !fileId || !croppedAreaPixels) return;

    const blob = await getCroppedBlob(previewUrl, croppedAreaPixels, outputPx);
    if (!blob) return;

    await onCropComplete(blob, `${fileId}.jpg`);

    removeFile(fileId);
    setIsDialogOpen(false);
  };

  const initials = getInitials(name);
  const avatarSrc = currentImagePublicId ? buildImageUrl(currentImagePublicId) : undefined;

  return (
    <div
      className="relative inline-flex"
      data-dragging={isDragging || undefined}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Avatar className="size-14 rounded-xl text-sm">
        {avatarSrc ? <AvatarImage alt={name} src={avatarSrc} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <button
        aria-label="Change profile photo"
        className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
        onClick={openFileDialog}
        type="button"
      >
        <CameraIcon className="size-3" />
      </button>
      <input
        {...getInputProps()}
        aria-label="Upload avatar image"
        className="sr-only"
        tabIndex={-1}
      />

      <Dialog onOpenChange={handleDialogChange} open={isDialogOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-140 *:[button]:hidden">
          <DialogDescription className="sr-only">Crop avatar</DialogDescription>
          <DialogHeader className="contents space-y-0 text-left">
            <DialogTitle className="flex items-center justify-between border-b p-4 text-base">
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Cancel"
                  className="-my-1 opacity-60"
                  disabled={isUploading}
                  onClick={() => handleDialogChange(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <ArrowLeftIcon aria-hidden="true" />
                </Button>
                <span>Crop avatar</span>
              </div>
              <Button
                className="-my-1"
                disabled={!previewUrl || !croppedAreaPixels}
                loading={isUploading}
                onClick={handleSave}
                type="button"
              >
                Save
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewUrl ? (
            <Cropper
              className="h-96 sm:h-120"
              image={previewUrl}
              onCropChange={handleCropChange}
              onZoomChange={setZoom}
              zoom={zoom}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          ) : null}
          <DialogFooter className="border-t px-4 py-6">
            <div className="mx-auto flex w-full max-w-80 items-center gap-4">
              <ZoomOutIcon aria-hidden="true" className="shrink-0 opacity-60" size={16} />
              <Slider
                aria-label="Zoom"
                className="flex-1"
                max={3}
                min={1}
                onValueChange={(next) => {
                  if (typeof next === "number") setZoom(next);
                  else if (Array.isArray(next) && typeof next[0] === "number") setZoom(next[0]);
                }}
                step={0.1}
                value={zoom}
              />
              <ZoomInIcon aria-hidden="true" className="shrink-0 opacity-60" size={16} />
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
