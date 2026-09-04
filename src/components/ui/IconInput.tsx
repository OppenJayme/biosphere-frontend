import type { InputHTMLAttributes, ReactNode } from "react";

export function IconInput({
  icon,
  rightSlot,
  className = "",
  ...props
}: {
  icon: ReactNode;
  rightSlot?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative mt-1.5">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
      <input
        className={`w-full rounded-lg border border-black/15 py-2.5 pl-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 ${
          rightSlot ? "pr-10" : "pr-3.5"
        } ${className}`}
        {...props}
      />
      {rightSlot && (
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightSlot}</span>
      )}
    </div>
  );
}
