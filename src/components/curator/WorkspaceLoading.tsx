/**
 * Route-level loading screen for the curator workspace. Rendered by each segment's
 * loading.tsx, so it fills only the main content area while the sidebar and topbar stay
 * interactive. Matches the action LoadingOverlay (logo, label, loading bar).
 */

import { LogoMark } from "@/components/layout/LogoMark";

export function WorkspaceLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden rounded-2xl"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-sage-100 blur-3xl" />
        <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-forest-100 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-2xl" />
      </div>

      <div className="relative flex w-56 flex-col items-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
          <LogoMark className="h-14 w-14 motion-safe:animate-[loading-breathe_1.8s_ease-in-out_infinite]" />
        </span>
        <p className="mt-4 text-sm font-medium text-zinc-600">{label}</p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-forest-100">
          <div className="h-full w-2/5 rounded-full bg-forest-700 motion-safe:animate-[loading-bar_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
        </div>
      </div>
    </div>
  );
}
