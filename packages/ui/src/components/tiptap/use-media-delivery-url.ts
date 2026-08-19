import {
  buildDownloadUrl,
  buildImageUrl,
  buildVideoUrl,
  type MediaResourceType,
} from "@sycom-learn/ui/image/cdn";

import { useSignedMediaUrlResolver } from "./signed-media-url-context";

function isExternalMediaRef(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/") ||
    src.startsWith("./") ||
    src.startsWith("../") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  );
}

/** Resolve a lesson media public id to a delivery URL (signed when a resolver is provided). */
export function useMediaDeliveryUrl(
  src: string | null | undefined,
  resourceType: MediaResourceType,
  options?: { format?: string | null; download?: boolean },
): string | undefined {
  const resolve = useSignedMediaUrlResolver();

  if (!src) return undefined;
  if (isExternalMediaRef(src)) return src;

  if (resolve) {
    return resolve({
      publicId: src,
      resourceType,
      format: options?.format,
      download: options?.download,
    });
  }

  if (options?.download) {
    return buildDownloadUrl(src, resourceType, options.format ?? undefined);
  }
  if (resourceType === "image") return buildImageUrl(src);
  return buildVideoUrl(src);
}
