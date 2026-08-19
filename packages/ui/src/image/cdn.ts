import { Cloudinary, CloudinaryFile } from "@cloudinary/url-gen";

function getViteCloudName(): string | undefined {
  try {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  } catch {
    return undefined;
  }
}

function getCloudName(): string {
  const fromVite = getViteCloudName();
  if (fromVite) return fromVite;

  if (typeof process !== "undefined") {
    const fromProcess = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (fromProcess) return fromProcess;
  }

  throw new Error(
    "Missing Cloudinary cloud name. Set VITE_CLOUDINARY_CLOUD_NAME (web) or CLOUDINARY_CLOUD_NAME (server).",
  );
}

function passthroughDeliveryUrl(id: string): string | null {
  if (
    id.startsWith("http://") ||
    id.startsWith("https://") ||
    id.startsWith("/") ||
    id.startsWith("./") ||
    id.startsWith("../") ||
    id.startsWith("data:") ||
    id.startsWith("blob:")
  ) {
    return id;
  }
  return null;
}

function createCld() {
  return new Cloudinary({
    cloud: { cloudName: getCloudName() },
    url: { analytics: false, secure: true },
  });
}

export function buildImageUrl(publicId: string): string {
  const passthrough = passthroughDeliveryUrl(publicId);
  if (passthrough) return passthrough;
  const id = publicId.replace(/^\/+/, "");
  const image = createCld().image(id);
  image.format("auto");
  image.quality("auto");
  return image.toURL();
}

/** Video (or audio-as-video) delivery URL from a Cloudinary public id. */
export function buildVideoUrl(publicId: string): string {
  const passthrough = passthroughDeliveryUrl(publicId);
  if (passthrough) return passthrough;
  const id = publicId.replace(/^\/+/, "");
  return createCld().video(id).toURL();
}

/** Raw file delivery URL (pdf, zip, …) from a Cloudinary public id. */
export function buildRawFileUrl(publicId: string): string {
  const passthrough = passthroughDeliveryUrl(publicId);
  if (passthrough) return passthrough;
  const id = publicId.replace(/^\/+/, "");
  const cloudConfig = { cloudName: getCloudName() };
  const urlConfig = { analytics: false, secure: true };
  return new CloudinaryFile(id, cloudConfig, urlConfig).setAssetType("raw").toURL();
}

/** Storage resource kinds, mirrors `StorageResourceType` in `@sycom-learn/db`. */
export type MediaResourceType = "image" | "video" | "audio" | "file";

/**
 * Delivery URL for an arbitrary uploaded asset, using its real Cloudinary
 * resource type to pick the URL path. Cloudinary serves each kind from a
 * different segment (`/image/`, `/video/`, `/raw/`) and audio is delivered as
 * video; a single hardcoded path 404s for everything stored elsewhere. For raw
 * files the format extension is part of the addressable id, so it's appended
 * when the public id doesn't already carry it.
 */
export function buildDownloadUrl(
  publicId: string,
  resourceType: MediaResourceType,
  format?: string,
): string {
  const passthrough = passthroughDeliveryUrl(publicId);
  if (passthrough) return passthrough;
  let id = publicId.replace(/^\/+/, "");
  const assetType =
    resourceType === "file" ? "raw" : resourceType === "audio" ? "video" : resourceType;
  if (assetType === "raw" && format && !id.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
    id = `${id}.${format}`;
  }
  const cloudConfig = { cloudName: getCloudName() };
  const urlConfig = { analytics: false, secure: true };
  return new CloudinaryFile(id, cloudConfig, urlConfig).setAssetType(assetType).toURL();
}
