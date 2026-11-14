import { LogoMark } from "@/components/layout/LogoMark";

// Shown the moment a visitor scans a QR label, while the exhibit is fetched on the server. Without
// it the phone shows a blank white page for the whole request (2 to 7 seconds when the API is cold).
// It mirrors ExhibitViewer's header and photo frame, so the page does not jump when it arrives.
export default function Loading() {
  return (
    <div className="min-h-screen bg-sage-50">
      <header className="flex items-center gap-2.5 bg-forest-900 px-4 py-3.5 sm:px-6">
        <LogoMark className="h-9 w-9 shrink-0" />
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold text-white">BioSphere</p>
          <p className="text-[0.6875rem] font-medium text-gold-500">USC Biological Museum</p>
        </div>
      </header>
      <main role="status" aria-live="polite" className="mx-auto max-w-2xl space-y-5 px-4 pb-28 pt-4 sm:px-6">
        <div className="flex aspect-4/3 flex-col items-center justify-center rounded-2xl bg-sage-100">
          <LogoMark className="h-12 w-12 motion-safe:animate-[loading-breathe_1.8s_ease-in-out_infinite]" />
          <p className="mt-3 text-sm font-semibold text-forest-900">Loading exhibit…</p>
          <div className="mt-2 h-1 w-full max-w-40 overflow-hidden rounded-full bg-forest-100">
            <div className="h-full w-2/5 rounded-full bg-forest-700 motion-safe:animate-[loading-bar_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
          </div>
        </div>
        <div className="h-7 w-2/3 rounded-lg bg-sage-100 motion-safe:animate-pulse" />
        <div className="space-y-2 rounded-2xl bg-white p-5">
          <div className="h-3 w-1/3 rounded bg-sage-100 motion-safe:animate-pulse" />
          <div className="h-3 w-full rounded bg-sage-100 motion-safe:animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-sage-100 motion-safe:animate-pulse" />
        </div>
      </main>
    </div>
  );
}
