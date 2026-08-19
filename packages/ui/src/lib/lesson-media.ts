import type { JSONContent } from "@tiptap/core";

import type { MediaResourceType } from "@sycom-learn/ui/image/cdn";

export type LessonMediaRef = {
  publicId: string;
  resourceType: MediaResourceType;
  format?: string | null;
  download: boolean;
};

function isStoredPublicId(src: unknown): src is string {
  if (typeof src !== "string" || src.length === 0) return false;
  return !(
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/") ||
    src.startsWith("./") ||
    src.startsWith("../") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

export function makeSignedMediaUrlKey(publicId: string, download?: boolean): string {
  return `${publicId}::${download ? "dl" : "inline"}`;
}

/** Walk lesson TipTap JSON and collect Cloudinary public ids that need signed delivery. */
export function collectLessonMediaRefs(content: JSONContent | null | undefined): LessonMediaRef[] {
  const items: LessonMediaRef[] = [];
  const seen = new Set<string>();

  function add(ref: LessonMediaRef) {
    const key = makeSignedMediaUrlKey(ref.publicId, ref.download);
    if (seen.has(key)) return;
    seen.add(key);
    items.push(ref);
  }

  function walk(node: JSONContent) {
    const type = node.type;
    const attrs = node.attrs ?? {};

    if (type === "image" && isStoredPublicId(attrs.src)) {
      add({ publicId: attrs.src, resourceType: "image", download: false });
    }

    if (type === "video") {
      if (isStoredPublicId(attrs.src)) {
        add({ publicId: attrs.src, resourceType: "video", download: false });
      }
      if (isStoredPublicId(attrs.poster)) {
        add({ publicId: attrs.poster, resourceType: "image", download: false });
      }
    }

    if (type === "audioBlock" && isStoredPublicId(attrs.src)) {
      add({ publicId: attrs.src, resourceType: "audio", download: false });
    }

    if (type === "fileAttachment" && isStoredPublicId(attrs.src)) {
      const resourceType = (attrs.resourceType as MediaResourceType | undefined) ?? "file";
      add({
        publicId: attrs.src,
        resourceType,
        format: (attrs.format as string | null | undefined) ?? null,
        download: true,
      });
    }

    node.content?.forEach(walk);
  }

  if (content) walk(content);
  return items;
}
