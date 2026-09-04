import type { ComponentType, SVGProps } from "react";

export function LocationStatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-xl font-semibold text-zinc-900">{value}</p>
        {note && <p className="text-xs text-forest-700">{note}</p>}
      </div>
    </div>
  );
}
