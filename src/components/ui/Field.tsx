import type { ReactNode } from "react";

export const fieldClasses =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted/70 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand aria-invalid:border-red-600 aria-invalid:focus:ring-red-600";

/** The id a field's error message uses, for the input's aria-describedby. */
export function fieldErrorId(htmlFor: string) {
  return `${htmlFor}-error`;
}

/** Spread onto an input to link it to its Field error message. */
export function fieldErrorProps(htmlFor: string, error: string | undefined) {
  return error ? { "aria-invalid": true as const, "aria-describedby": fieldErrorId(htmlFor) } : {};
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-red-700">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  optional = false,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Marks the label "(optional)" so required fields don't each need an asterisk. */
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-ink-muted">
        {label}
        {optional && <span className="font-normal text-ink-muted/80"> (optional)</span>}
      </label>
      {children}
      {error && <FieldError id={fieldErrorId(htmlFor)}>{error}</FieldError>}
    </div>
  );
}

export function FieldGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand">{children}</p>
  );
}
