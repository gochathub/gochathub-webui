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

export async function uploadAttachment(
  file: File,
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

  const put = await fetch(session.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!put.ok) {
    throw new Error(`upload failed: ${put.status}`);
  }

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
