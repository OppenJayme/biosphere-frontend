"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Field } from "@/components/ui/Field";
import { IconInput } from "@/components/ui/IconInput";
import { LockIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

export function PasswordField({
  id,
  label = "Password",
  ...props
}: {
  id: string;
  label?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id}>
      <IconInput
        id={id}
        type={visible ? "text" : "password"}
        icon={<LockIcon className="h-4 w-4" />}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        }
        {...props}
      />
    </Field>
  );
}
