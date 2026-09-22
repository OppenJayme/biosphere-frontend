import { QrCodeIcon } from "@/components/icons";

// The backend has no exhibits/QR module yet (no controller, no entity) — this
// stays an explicit "not built yet" state rather than mock counts. Revisit
// once that module exists.
export function PublicQrReadiness() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-sage-50 px-4 py-8 text-center">
      <QrCodeIcon className="h-6 w-6 text-zinc-400" />
      <p className="text-sm font-medium text-zinc-600">QR readiness isn&rsquo;t tracked yet</p>
      <p className="text-xs text-zinc-500">The exhibits/QR module hasn&rsquo;t been built on the backend.</p>
    </div>
  );
}
