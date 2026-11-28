"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { FileTypeIcon, UploadIcon } from "@/components/icons";
import {
  NAMES_FILE_ACCEPT,
  readNamesFile,
  type VisitorName,
} from "@/features/visit-requests/names-file";

const SAMPLE_FORMATS = ["txt", "docx", "pdf"] as const;

/**
 * Optional shortcut on the visit request form: reads a .txt, .docx or .pdf list in the browser and
 * hands the names to the form, which adds them as name rows to review. Nothing is uploaded.
 */
export function VisitorNamesFile({
  onNames,
  disabled = false,
}: {
  /** Adds the names and returns what to tell the visitor about the result. */
  onNames: (names: VisitorName[], details: { fileName: string; skipped: number }) => string;
  disabled?: boolean;
}) {
  const inputId = useId();
  const statusId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Clear the picker so choosing the same file again (after editing it) still triggers a read.
    event.target.value = "";
    if (!file) return;
    setReading(true);
    setStatus(null);
    try {
      const result = await readNamesFile(file);
      setStatus(
        result.ok
          ? { tone: "ok", text: onNames(result.names, { fileName: file.name, skipped: result.skipped }) }
          : { tone: "error", text: result.message },
      );
    } catch {
      setStatus({ tone: "error", text: "That file could not be read. Save it again, or type the names." });
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-dashed border-forest-900/20 bg-sage-50 p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <input
          ref={input}
          id={inputId}
          type="file"
          accept={NAMES_FILE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => void handleFile(event)}
        />
        <button
          type="button"
          disabled={disabled || reading}
          aria-describedby={statusId}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-brand-solid px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-solid-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadIcon className="h-4 w-4" aria-hidden="true" />
          {reading ? "Reading the file…" : "Upload"}
          {!reading && <span className="sr-only"> a list of visitor names</span>}
        </button>
        <span className="text-sm text-ink-muted">Have a list already? (optional)</span>
        {/* Sample lists in public/templates; names-file.test.ts checks that they keep reading cleanly. */}
        <span className="flex items-center gap-1.5 text-sm text-ink-muted">
          See a sample:
          {SAMPLE_FORMATS.map((format) => (
            <a
              key={format}
              href={`/templates/visitor-names-sample.${format}`}
              download
              aria-label={`Download a sample visitor list (.${format})`}
              title={`Sample .${format}`}
              className="rounded-md p-0.5 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand motion-reduce:transition-none"
            >
              <FileTypeIcon type={format} className="h-8 w-7 text-ink-muted" />
            </a>
          ))}
        </span>
      </div>
      <p
        id={statusId}
        role={status?.tone === "error" ? "alert" : "status"}
        className={status?.tone === "error" ? "text-sm font-medium text-red-700" : "text-sm font-medium text-brand"}
      >
        {status?.text}
      </p>
    </div>
  );
}
