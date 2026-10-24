import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export const ALLOWED_IMAGE_MIME = Object.keys(ALLOWED_IMAGE_TYPES);

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.status = status;
  }
}

/**
 * Validates an uploaded file and writes it to public/uploads/<folder>.
 * Files are stored with a random name, never executable, and served
 * from the static public directory with the correct extension.
 */
export async function saveUpload(
  file: File,
  folder: string,
): Promise<{ filename: string; url: string; mimeType: string; size: number }> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new UploadError("No file provided");
  }
  if (file.size <= 0) {
    throw new UploadError("File is empty");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("File exceeds the 5MB size limit");
  }
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new UploadError(
      `Unsupported file type. Allowed: ${ALLOWED_IMAGE_MIME.join(", ")}`,
    );
  }
  // Defensive: verify magic bytes for raster images (do not trust the header).
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidSignature(buffer, file.type)) {
    throw new UploadError("File content does not match its declared type");
  }
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "") || "general";
  const uploadRoot = path.join(process.cwd(), "public", "uploads", safeFolder);
  await fs.mkdir(uploadRoot, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const target = path.join(uploadRoot, filename);
  if (!target.startsWith(uploadRoot)) {
    throw new UploadError("Invalid upload path", 400);
  }
  await fs.writeFile(target, buffer);
  return {
    filename,
    url: `/uploads/${safeFolder}/${filename}`,
    mimeType: file.type,
    size: file.size,
  };
}

function hasValidSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/svg+xml") {
    const head = buffer.subarray(0, 512).toString("utf8").trim().toLowerCase();
    if (head.includes("<script") || head.includes("javascript:")) return false;
    return head.includes("<svg");
  }
  if (mimeType === "image/png") {
    return buffer.length > 8 && buffer.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
  }
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  if (mimeType === "application/pdf") {
    return buffer.length > 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }
  return false;
}
