"use client";

import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

const LENGTH = 6;

export function OtpInput({
  name,
  onChange,
}: {
  name?: string;
  onChange?: (value: string) => void;
}) {
  const [values, setValues] = useState<string[]>(Array(LENGTH).fill(""));
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  function update(next: string[]) {
    setValues(next);
    onChange?.(next.join(""));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[index] = digit;
    update(next);
    if (digit && index < LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH).split("");
    if (digits.length === 0) return;
    e.preventDefault();
    const next = Array(LENGTH).fill("");
    digits.forEach((d, i) => (next[i] = d));
    update(next);
    inputs.current[Math.min(digits.length, LENGTH - 1)]?.focus();
  }

  return (
    <div className="flex gap-2.5">
      {name && <input type="hidden" name={name} value={values.join("")} />}
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={v}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${LENGTH}`}
          className="h-14 w-12 rounded-lg border border-black/15 text-center text-lg font-semibold text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      ))}
    </div>
  );
}
