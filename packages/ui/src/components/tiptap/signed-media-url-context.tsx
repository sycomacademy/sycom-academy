import { createContext, use } from "react";

import type { MediaResourceType } from "@sycom-learn/ui/image/cdn";

export type ResolvedMediaUrlInput = {
  publicId: string;
  resourceType: MediaResourceType;
  format?: string | null;
  download?: boolean;
};

export type ResolveMediaUrl = (input: ResolvedMediaUrlInput) => string | undefined;

export const SignedMediaUrlContext = createContext<ResolveMediaUrl | null>(null);

export function useSignedMediaUrlResolver(): ResolveMediaUrl | null {
  return use(SignedMediaUrlContext);
}
