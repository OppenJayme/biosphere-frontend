/**
 * Server-only client for exhibit QR codes and printable labels.
 *
 * Every backend QR/label call lives here on purpose: the QR contract may change (a teammate's
 * QR module proposes different routes), and the same-origin routes under /api/exhibits/[id]/ that
 * the curator UI uses should not have to change with it.
 */

import "server-only";
import { apiResponse } from "@/lib/api-client";

export type QrFormat = "png" | "svg";

export const QR_DEFAULT_SIZE = 1024;
export const QR_MIN_SIZE = 128;
export const QR_MAX_SIZE = 2048;

export type ExhibitImageFile = {
  body: ArrayBuffer;
  contentType: string;
  fileName: string;
};

function fileNameFrom(response: Response, fallback: string) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const name = match?.[1]?.trim();
  return name && /^[\w.-]+$/.test(name) ? name : fallback;
}

async function toFile(response: Response, fallbackType: string, fallbackName: string) {
  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? fallbackType,
    fileName: fileNameFrom(response, fallbackName),
  } satisfies ExhibitImageFile;
}

/** The QR code encoding the exhibit's public URL; the same URL always gives the same code. */
export async function getExhibitQrCode(id: string, format: QrFormat, size = QR_DEFAULT_SIZE) {
  const params = new URLSearchParams({ format });
  if (format === "png") params.set("size", String(size));
  const response = await apiResponse(`/exhibits/${encodeURIComponent(id)}/qr?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  return toFile(
    response,
    format === "png" ? "image/png" : "image/svg+xml",
    `exhibit-qr.${format}`,
  );
}

/** Printable label (REQ-4.12-06): museum name, specimen names, QR code, and the full URL. */
export async function getExhibitLabel(id: string) {
  const response = await apiResponse(`/exhibits/${encodeURIComponent(id)}/label`, {
    method: "GET",
    cache: "no-store",
  });
  return toFile(response, "image/svg+xml", "exhibit-label.svg");
}
