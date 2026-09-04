import type { ReactNode } from "react";
import { AuthShowcase } from "./AuthShowcase";

export function AuthLayout({
  title,
  description,
  children,
  footnote,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footnote?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase />

      <div className="flex min-h-screen flex-col px-6 py-12 sm:px-12 lg:px-16 xl:px-20">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="font-serif text-3xl font-semibold text-forest-900">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{description}</p>

            <div className="mt-8">{children}</div>

            {footnote && (
              <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500">{footnote}</p>
            )}
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} BioSphere Inventory. All rights reserved.
        </p>
      </div>
    </div>
  );
}
