// Presigned attachment upload: create session → PUT to storage → complete.
// Download URLs are short-lived; never cache them beyond the message render.
import client, { unwrap } from "./client";
import type { components } from "./schema";

export interface UploadedAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

// XHR, not fetch: fetch has no upload progress events.
function putFile(
  url: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.upload.onprogress = (e) => onProgress?.(e.loaded, e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`upload failed: ${xhr.status}`));
    xhr.onerror = () => reject(new Error("upload failed: network"));
    xhr.onabort = () => reject(new DOMException("aborted", "AbortError"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(file);
  });
}

export async function deleteAttachment(attachmentId: string): Promise<void> {
  await client.DELETE("/attachments/{attachmentId}", {
    params: { path: { attachmentId } },
  });
}

export async function uploadAttachment(
  file: File,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<UploadedAttachment> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const sha256 = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const session = await unwrap(
    await client.POST("/attachments", {
      body: {
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: buf.byteLength,
        sha256,
      },
    }),
  );

  await putFile(session.upload_url, file, onProgress, signal);

  const created = await unwrap(
    await client.POST("/attachments/{attachmentId}/complete", {
      params: { path: { attachmentId: session.attachment.id } },
    }),
  );
  return {
    id: created.id,
    filename: created.filename,
    mimeType: created.mime_type,
    sizeBytes: created.size_bytes,
  };
}

// refetch a fresh download URL after expiry (403) — never store presigned
// URLs long-term.
export async function refreshAttachment(
  attachmentId: string,
): Promise<components["schemas"]["Attachment"]> {
  return await unwrap(
    await client.GET("/attachments/{attachmentId}", {
      params: { path: { attachmentId } },
    }),
  );
}
