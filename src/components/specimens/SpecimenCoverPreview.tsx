/** Lazy private cover preview; keyed by the caller to prevent cross-record images. */
"use client";

import { useEffect, useState } from "react";
import { PawIcon } from "@/components/icons";
import {
  getSpecimenCoverPreview,
  type CoverPreviewResult,
} from "@/features/specimens/cover-preview-action";

export function CoverPreviewContent({
  result,
  alt,
  onRetry,
  onImageError,
}: {
  result: CoverPreviewResult | null;
  alt: string;
  onRetry: () => void;
  onImageError: () => void;
}) {
  return (
    <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-sage-100 text-forest-700">
      {result?.kind === "image" ? (
        // Private signed links bypass image optimization and its shared cache.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.signedUrl}
          alt={result.caption?.trim() || alt}
          onError={onImageError}
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
        />
      ) : (
        <>
          <PawIcon className="h-10 w-10" />
          <p role="status" className="px-3 text-center text-xs">
            {!result
              ? "Loading cover image…"
              : result.kind === "empty"
                ? "No cover image selected."
                : result.message}
          </p>
          {result?.kind === "error" && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-forest-700 px-3 py-1 text-xs hover:bg-sage-200 focus-visible:outline-2 focus-visible:outline-forest-700"
            >
              Retry cover image
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function SpecimenCoverPreview({ specimenId, alt }: { specimenId: string; alt: string }) {
  const [result, setResult] = useState<CoverPreviewResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    // Ignore late responses after selection changes or a newer retry starts.
    getSpecimenCoverPreview(specimenId).then(
      (response) => {
        if (active) setResult(response);
      },
      () => {
        if (active)
          setResult({ kind: "error", message: "The cover image could not be loaded. Try again." });
      },
    );
    return () => {
      active = false;
    };
  }, [specimenId, attempt]);

  return (
    <CoverPreviewContent
      result={result}
      alt={alt}
      onImageError={() =>
        setResult({
          kind: "error",
          message: "The image link expired or could not be displayed. Try again.",
        })
      }
      onRetry={() => {
        setResult(null);
        setAttempt((value) => value + 1);
      }}
    />
  );
}
