import type { InputHTMLAttributes } from "react";
import { Field, fieldClasses } from "./Field";

export function TextField({
  id,
  label,
  className = "",
  ...props
}: { id: string; label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} htmlFor={id}>
      <input id={id} name={id} className={`${fieldClasses} ${className}`} {...props} />
    </Field>
  );
}
