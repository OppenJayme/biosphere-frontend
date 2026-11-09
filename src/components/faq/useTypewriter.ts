"use client";

import { useEffect, useRef, useState } from "react";
import { TYPEWRITER_TICK_MS, nextTypedLength } from "@/features/faq/typewriter";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns how many characters of `text` to show. When `animate` is false, or the visitor asked
 * for reduced motion, the whole text shows at once. `onProgress` runs after each reveal (used to
 * keep the chat scrolled) and `onDone` once the text is complete.
 */
export function useTypewriter(
  text: string,
  animate: boolean,
  { onProgress, onDone }: { onProgress?: () => void; onDone?: () => void } = {},
) {
  const [shown, setShown] = useState(() => (animate && !prefersReducedMotion() ? 0 : text.length));
  const callbacks = useRef({ onProgress, onDone });
  useEffect(() => {
    callbacks.current = { onProgress, onDone };
  });

  const done = shown >= text.length;

  useEffect(() => {
    if (done) {
      callbacks.current.onDone?.();
      return;
    }
    const timer = window.setInterval(() => {
      setShown((current) => nextTypedLength(current, text.length));
      callbacks.current.onProgress?.();
    }, TYPEWRITER_TICK_MS);
    return () => window.clearInterval(timer);
  }, [done, text.length]);

  return { visible: text.slice(0, shown), done };
}
