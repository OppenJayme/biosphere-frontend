import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid-forest" | "outline-forest" | "solid-gold" | "outline-white";

const VARIANT_CLASSES: Record<Variant, string> = {
  "solid-forest": "bg-forest-700 text-white hover:bg-forest-800",
  "outline-forest": "border border-forest-700 text-forest-800 hover:bg-forest-100/60",
  "solid-gold": "bg-gold-600 text-white hover:bg-gold-700",
  "outline-white": "border border-white/70 text-white hover:bg-white/10",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest-700 disabled:opacity-50 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

type LinkButtonProps = CommonProps & {
  href: string;
};

type NativeButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "solid-forest",
  children,
  className = "",
  href,
  ...rest
}: (LinkButtonProps | NativeButtonProps) & { href?: string }) {
  const classes = `${baseClasses} ${VARIANT_CLASSES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
