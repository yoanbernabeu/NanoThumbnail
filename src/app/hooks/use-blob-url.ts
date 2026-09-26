import { blobUrl } from '../stores/workspace';

/** Stable object URL for a Blob (cached; revoked when the image is deleted). */
export function useBlobUrl(blob: Blob | undefined): string | undefined {
  return blob ? blobUrl(blob) : undefined;
}
