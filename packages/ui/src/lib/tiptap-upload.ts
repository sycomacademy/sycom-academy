/** Result of uploading a binary picked in the editor; `src` is typically a CDN public id. */
export type TiptapEditorUploadResult = {
  src: string;
  alt?: string;
  /** Cloudinary resource kind, needed to build the correct delivery URL path. */
  resourceType?: "image" | "video" | "audio" | "file";
  /** File format/extension; required to address `raw` assets on delivery. */
  format?: string;
};

export type TiptapEditorUploadFn = (file: File) => Promise<TiptapEditorUploadResult>;
