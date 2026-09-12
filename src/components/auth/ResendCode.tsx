"use client";

import { useEffect, useState, useTransition } from "react";

export function ResendCode({
  action,
  seconds: initialSeconds = 30,
}: {
  action: () => Promise<void>;
  seconds?: number;
}) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [pending, startTransition] = useTransition();

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
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await action();
          setSeconds(initialSeconds);
        })
      }
      className="font-semibold text-forest-700 hover:text-forest-800 disabled:opacity-50"
    >
      {pending ? "Sending…" : "Resend code"}
    </button>
  );
}
