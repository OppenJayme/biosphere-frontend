/**
 * PDF text for the visit form's "fill names from a file". Loaded only when a visitor picks a PDF,
 * so pdf.js stays out of every other page's bundle. Text-based PDFs only; scans have no text.
 */
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

let workerStarted = false;

function startWorker() {
  if (workerStarted) return;
  GlobalWorkerOptions.workerPort = new Worker(new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url), {
    type: "module",
  });
  workerStarted = true;
}

/** One line per text line in the PDF, pages in order. */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  startWorker();
  const loadingTask = getDocument({ data: bytes });
  const document = await loadingTask.promise;
  try {
    const lines: string[] = [];
    for (let page = 1; page <= document.numPages; page += 1) {
      const content = await (await document.getPage(page)).getTextContent();
      let line = "";
      let lineY: number | undefined;
      for (const item of content.items) {
        if (!("str" in item)) continue;
        // A new baseline starts a new line even when the PDF does not mark the line end,
        // as in lists written one name per row.
        const y = item.transform[5];
        const tolerance = Math.max(2, (item.height || 0) * 0.5);
        if (line && lineY !== undefined && Math.abs(y - lineY) > tolerance) {
          lines.push(line);
          line = "";
        }
        if (!line) lineY = y;
        line += item.str;
        if (item.hasEOL) {
          lines.push(line);
          line = "";
        }
      }
      if (line) lines.push(line);
    }
    return lines.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}
