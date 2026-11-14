"use client";

import { useState } from "react";
import { ImageIcon } from "@/components/icons";
import { LogoMark } from "@/components/layout/LogoMark";

/**
 * A plain <img> for short-lived signed storage links (next/image would cache a private image past
 * its expiry) that covers its frame with a loading state until the photo arrives, and with a clear
 * message if it fails. Place it inside a positioned frame with a fixed aspect ratio.
 */
export function LoadingImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  failedText = "This photo could not be loaded. Reload to request a fresh link.",
}: {
  src: string;
  alt: string;
  className?: string;
  failedText?: string;
}) {
  const [status, setStatus] = useState<{ src: string; value: "loaded" | "failed" } | null>(null);
  const current = status?.src === src ? status.value : null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        decoding="async"
        // Server rendered images can finish before hydration, after onLoad already fired.
        ref={(element) => {
          if (element?.complete && current === null) {
            setStatus({ src, value: element.naturalWidth > 0 ? "loaded" : "failed" });
          }
        }}
        onLoad={() => setStatus({ src, value: "loaded" })}
        onError={() => setStatus({ src, value: "failed" })}
        className={className}
      />
      {current === null && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center bg-sage-100">
          <LogoMark className="h-9 w-9 motion-safe:animate-[loading-breathe_1.8s_ease-in-out_infinite]" />
          <p className="mt-2 text-xs font-semibold text-forest-900">Loading photo…</p>
        </div>
      )}
      {current === "failed" && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-sage-100 px-8 text-center text-xs text-zinc-600"
        >
          <ImageIcon className="h-6 w-6 text-forest-700/60" />
          {failedText}
        </div>
      )}
    </>
  );
}
