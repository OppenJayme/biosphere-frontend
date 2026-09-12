"use client";

import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

export function OtpInput({
  name,
  length = 6,
  onChange,
}: {
  name?: string;
  length?: number;
  onChange?: (value: string) => void;
}) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
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
    if (digit && index < length - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length).split("");
    if (digits.length === 0) return;
    e.preventDefault();
    const next = Array(length).fill("");
    digits.forEach((d, i) => (next[i] = d));
    update(next);
    inputs.current[Math.min(digits.length, length - 1)]?.focus();
  }

  return (
    <div className="flex flex-wrap gap-2">
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
          aria-label={`Digit ${i + 1} of ${length}`}
          className="h-12 w-9 rounded-lg border border-black/15 text-center text-base font-semibold text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      ))}
    </div>
  );
}
