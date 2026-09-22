"use client";

import { useEffect, useState } from "react";

export function ResendCode({ seconds: initialSeconds = 30 }: { seconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  if (seconds > 0) {
    return (
      <span className="text-zinc-400">
        Resend code&nbsp;<span className="tabular-nums">{seconds}s</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setSeconds(initialSeconds)}
      className="font-semibold text-forest-700 hover:text-forest-800"
    >
      Resend code
    </button>
  );
}
