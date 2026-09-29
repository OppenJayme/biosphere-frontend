/**
 * Browser helpers for the curator's QR downloads and label printing. They only call this app's
 * same-origin /api/exhibits/[id]/ routes, which proxy the backend (see qr-api.ts).
 */

import type { QrFormat } from "./qr-api";

export function exhibitQrUrl(exhibitId: string, format: QrFormat, download = false) {
  const params = new URLSearchParams({ format });
  if (download) params.set("download", "1");
  return `/api/exhibits/${encodeURIComponent(exhibitId)}/qr?${params}`;
}

export function exhibitLabelUrl(exhibitId: string, download = false) {
  return `/api/exhibits/${encodeURIComponent(exhibitId)}/label${download ? "?download=1" : ""}`;
}

async function fetchFile(url: string) {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error("The QR file could not be downloaded. Check your connection and try again.");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "The QR file could not be prepared. Try again later.";
    throw new Error(message);
  }
  return response.blob();
}

/** Fetches first so a failure shows a message instead of saving an error page as the file. */
export async function downloadExhibitFile(url: string, fileName: string) {
  const blob = await fetchFile(url);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/**
 * Prints only the label (REQ-4.12-06). The SVG is shown through an <img> in a hidden frame, so
 * nothing inside the SVG can run, and the frame is removed after printing.
 */
export async function printExhibitLabel(exhibitId: string) {
  const blob = await fetchFile(exhibitLabelUrl(exhibitId));
  const objectUrl = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.append(frame);

  const cleanup = () => {
    frame.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    cleanup();
    throw new Error("The label could not be opened for printing.");
  }

  await new Promise<void>((resolve, reject) => {
    const image = doc.createElement("img");
    image.alt = "Exhibit label";
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The label could not be opened for printing."));
    const style = doc.createElement("style");
    style.textContent =
      "@page{margin:12mm}html,body{margin:0}body{display:flex;justify-content:center}img{width:90mm;height:auto}";
    doc.head.append(style);
    doc.body.append(image);
    image.src = objectUrl;
  }).catch((error) => {
    cleanup();
    throw error;
  });

  win.addEventListener("afterprint", () => setTimeout(cleanup, 0), { once: true });
  win.focus();
  win.print();
  // Fallback for browsers that don't fire afterprint on the frame.
  setTimeout(cleanup, 60_000);
}
