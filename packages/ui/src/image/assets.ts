/**
 * Catalogue of static (committed-ish) assets hosted on the CDN.
 * Public IDs are the storage keys uploaded to Cloudinary; renaming an
 * asset is one edit here, not a search-and-replace across the codebase.
 *
 * User-generated assets (avatars, course content) live in the DB, not here.
 */

export const BRAND = {
  LOGO: "brand/sycom-logo-jpg",
  LOGO_PNG: "brand/sycom-logo-png",
  FAVICON: "brand/favicon",
  LOGO_ICON: "brand/sycom-logo-icon-jpg",
} as const;
