import type { PUBLIC_QR_READINESS } from "@/lib/dummy-data/dashboard";

export function PublicQrReadiness({ items }: { items: readonly (typeof PUBLIC_QR_READINESS)[number][] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-sage-50 p-3.5 text-center">
          <p className="text-lg font-semibold text-forest-900">{item.value}</p>
          <p className="mt-0.5 text-xs font-medium text-zinc-700">{item.label}</p>
          <p className="text-[11px] text-zinc-500">{item.note}</p>
        </div>
      ))}
    </div>
  );
}
