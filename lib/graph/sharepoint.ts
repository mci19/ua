import type { Client } from "@microsoft/microsoft-graph-client";
import { ApiError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

export interface UploadArgs {
  client: Client;
  siteId: string;
  driveId: string;
  folderPath: string;
  filename: string;
  content: ArrayBuffer | Uint8Array;
  contentType?: string;
}

export interface UploadedItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
}

const FOUR_MB = 4 * 1024 * 1024;
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 3;

// SharePoint forbids /, \, :, *, ?, ", <, >, |, #, %, plus control chars
// and trailing whitespace/dots; full names cannot exceed 255 chars.
export function sanitizeFilename(filename: string): string {
  const cleaned = filename
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f]/g, "")
    .replace(/[/\\:*?"<>|#%]/g, "_")
    .replace(/^\.+/, "")
    .replace(/[\s.]+$/g, "")
    .slice(0, 200)
    .trim();
  return cleaned || "bestand";
}

// Honours Retry-After when set; otherwise exponential backoff 1s/2s/4s.
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  attempt = 0,
): Promise<Response> {
  const res = await fetch(url, init);
  if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
    const retryAfter = Number(res.headers.get("Retry-After")) || 2 ** attempt;
    logger.warn("Graph upload retry", { status: res.status, attempt, retryAfter });
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return fetchWithRetry(url, init, attempt + 1);
  }
  return res;
}

export async function uploadDocument({
  client,
  siteId,
  driveId,
  folderPath,
  filename,
  content,
}: UploadArgs): Promise<UploadedItem> {
  const safeName = sanitizeFilename(filename);
  const itemPath = `${folderPath.replace(/^\/+|\/+$/g, "")}/${safeName}`;
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);

  if (bytes.byteLength <= FOUR_MB) {
    const item = await client
      .api(`/sites/${siteId}/drives/${driveId}/root:/${itemPath}:/content`)
      .header("Content-Type", "application/octet-stream")
      .put(bytes);
    return summarize(item);
  }

  const session = await client
    .api(`/sites/${siteId}/drives/${driveId}/root:/${itemPath}:/createUploadSession`)
    .post({
      item: { "@microsoft.graph.conflictBehavior": "replace", name: safeName },
    });

  const uploadUrl: string = session.uploadUrl;
  for (let offset = 0; offset < bytes.byteLength; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.byteLength);
    const chunk = bytes.slice(offset, end);
    const body: BodyInit = new Blob([chunk]);
    const res = await fetchWithRetry(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${offset}-${end - 1}/${bytes.byteLength}`,
      },
      body,
    });
    if (!res.ok && res.status !== 202) {
      const text = await res.text();
      logger.error("Graph chunk upload failed", { status: res.status, text });
      throw new ApiError(res.status, "SharePoint upload failed", {
        dutchMessage: "Het bestand kon niet worden geüpload.",
      });
    }
    if (res.ok) {
      const item = await res.json();
      return summarize(item);
    }
  }
  throw new ApiError(500, "Upload session did not complete");
}

export async function ensureFolder({
  client,
  siteId,
  driveId,
  parentPath,
  folderName,
}: {
  client: Client;
  siteId: string;
  driveId: string;
  parentPath: string;
  folderName: string;
}): Promise<string> {
  const safe = parentPath.replace(/^\/+|\/+$/g, "");
  const fullPath = `${safe}/${folderName}`;
  try {
    await client.api(`/sites/${siteId}/drives/${driveId}/root:/${fullPath}`).get();
    return fullPath;
  } catch {
    const parentApi = safe
      ? `/sites/${siteId}/drives/${driveId}/root:/${safe}:/children`
      : `/sites/${siteId}/drives/${driveId}/root/children`;
    await client.api(parentApi).post({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "replace",
    });
    return fullPath;
  }
}

function summarize(item: { id: string; name: string; size: number; webUrl: string }): UploadedItem {
  return { id: item.id, name: item.name, size: item.size, webUrl: item.webUrl };
}
