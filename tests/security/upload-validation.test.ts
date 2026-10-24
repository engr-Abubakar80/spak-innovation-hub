import { describe, expect, it } from "vitest";

const ALLOWED_IMAGE_MIME = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
  "application/pdf",
];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function isAllowedMime(type: string) {
  return ALLOWED_IMAGE_MIME.includes(type);
}

function isWithinSize(size: number) {
  return size > 0 && size <= MAX_UPLOAD_BYTES;
}

describe("file upload validation", () => {
  it("allows PNG, JPG, SVG, WebP, PDF", () => {
    expect(isAllowedMime("image/png")).toBe(true);
    expect(isAllowedMime("image/jpeg")).toBe(true);
    expect(isAllowedMime("image/svg+xml")).toBe(true);
    expect(isAllowedMime("application/pdf")).toBe(true);
  });

  it("rejects executable and unsupported types", () => {
    expect(isAllowedMime("text/html")).toBe(false);
    expect(isAllowedMime("application/javascript")).toBe(false);
    expect(isAllowedMime("application/x-sh")).toBe(false);
    expect(isAllowedMime("image/gif")).toBe(false);
  });

  it("enforces size limits (<= 5MB, > 0)", () => {
    expect(isWithinSize(1024)).toBe(true);
    expect(isWithinSize(MAX_UPLOAD_BYTES)).toBe(true);
    expect(isWithinSize(0)).toBe(false);
    expect(isWithinSize(MAX_UPLOAD_BYTES + 1)).toBe(false);
  });
});
