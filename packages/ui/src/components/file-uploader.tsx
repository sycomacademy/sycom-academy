import { FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

import { Button } from "@sycom-learn/ui/components/button";
import { Progress } from "@sycom-learn/ui/components/progress";
import { ScrollArea } from "@sycom-learn/ui/components/scroll-area";
import {
  type FileWithPreview,
  formatBytes,
  useFileUpload,
} from "@sycom-learn/ui/hooks/use-file-upload";
import { cn } from "@sycom-learn/ui/lib/utils";

export interface FileUploaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  accept?: string;
  maxSize?: number;
  maxFileCount?: number;
  multiple?: boolean;
  disabled?: boolean;
  /** When set, associates an external `<label htmlFor={inputId}>` with the hidden file input. */
  inputId?: string;
  progresses?: Record<string, number>;
  onFilesChange?: (files: FileWithPreview[]) => void;
}

export function FileUploader({
  accept = "image/*",
  maxSize = 1024 * 1024 * 5,
  maxFileCount = 1,
  multiple = false,
  disabled = false,
  inputId,
  progresses,
  onFilesChange,
  className,
  ...divProps
}: FileUploaderProps) {
  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept,
    maxSize,
    maxFiles: maxFileCount,
    multiple: multiple || maxFileCount > 1,
    onFilesChange,
  });

  const isFull = files.length >= maxFileCount;
  const isDisabled = disabled || isFull;

  return (
    <div className="relative flex w-full min-w-0 flex-col gap-4 overflow-hidden">
      <div
        aria-disabled={isDisabled || undefined}
        className={cn(
          "group relative grid h-40 w-full cursor-pointer place-items-center rounded-md border border-dashed border-input px-5 py-2.5 text-center transition hover:bg-muted/25",
          "ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden",
          isDragging && "border-muted-foreground/50",
          isDisabled && "pointer-events-none opacity-60",
          className,
        )}
        data-dragging={isDragging || undefined}
        onClick={openFileDialog}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFileDialog();
          }
        }}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        {...divProps}
      >
        <input
          {...getInputProps({
            disabled: isDisabled,
            ...(inputId ? { id: inputId } : {}),
          })}
          {...(inputId ? {} : { "aria-label": "Upload files" })}
          className="sr-only"
          tabIndex={-1}
        />
        <div className="flex flex-col items-center justify-center gap-3 sm:px-5">
          <div className="rounded-full border border-dashed p-2.5">
            <UploadIcon aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-px">
            <p className="text-xs text-muted-foreground">
              {isDragging ? "Drop the files here" : "Drag and drop files here, or click to select"}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {maxFileCount > 1
                ? `Up to ${maxFileCount === Number.POSITIVE_INFINITY ? "multiple" : maxFileCount} files (${formatBytes(maxSize)} each)`
                : `Max file size: ${formatBytes(maxSize)}`}
            </p>
          </div>
        </div>
      </div>

      {errors.length > 0 ? (
        <ul className="text-xs text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {files.length > 0 ? (
        <ScrollArea className="h-fit w-full">
          <div className="flex max-h-32 flex-col gap-3">
            {files.map((file) => (
              <FileCard
                file={file}
                key={file.id}
                onRemove={() => removeFile(file.id)}
                progress={progresses?.[file.file.name]}
              />
            ))}
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
}

function FileCard({
  file,
  progress,
  onRemove,
}: {
  file: FileWithPreview;
  progress?: number;
  onRemove: () => void;
}) {
  const isImage = file.file.type.startsWith("image/");
  const sourceFile = file.file;
  const sizeLabel = formatBytes(sourceFile.size);

  return (
    <div className="relative flex items-center gap-2.5">
      <div className="flex flex-1 gap-2.5">
        {isImage && file.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={sourceFile.name}
            className="aspect-square size-12 shrink-0 rounded-md object-cover"
            src={file.preview}
          />
        ) : (
          <FileTextIcon aria-hidden="true" className="size-10 text-muted-foreground" />
        )}
        <div className="flex w-full flex-col gap-1.5">
          <div className="flex flex-col gap-px">
            <p className="line-clamp-1 text-xs font-medium text-foreground/80">{sourceFile.name}</p>
            <p className="text-xs text-muted-foreground">{sizeLabel}</p>
          </div>
          {typeof progress === "number" ? <Progress value={progress} /> : null}
        </div>
      </div>
      <Button
        aria-label="Remove file"
        className="size-7"
        onClick={onRemove}
        size="icon"
        type="button"
        variant="outline"
      >
        <XIcon aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
