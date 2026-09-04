import { PawIcon, MailIcon, LockIcon, ShieldIcon } from "@/components/icons";

const ICONS = { specimen: PawIcon, mail: MailIcon, lock: LockIcon, shield: ShieldIcon } as const;

const ICON_STYLES: Record<keyof typeof ICONS, string> = {
  specimen: "bg-forest-100 text-forest-700",
  mail: "bg-amber-100 text-amber-600",
  lock: "bg-red-100 text-red-600",
  shield: "bg-amber-100 text-amber-600",
};

const NOTE_STYLES = {
  positive: "text-forest-700",
  warning: "text-amber-600",
  danger: "text-red-600",
} as const;

export function StatCard({
  label,
  value,
  note,
  tone,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  tone: keyof typeof NOTE_STYLES;
  icon: keyof typeof ICONS;
}) {
  const Icon = ICONS[icon];

  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/10 bg-white p-5">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ICON_STYLES[icon]}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="text-2xl font-semibold text-zinc-900">{value}</p>
        <p className={`text-xs font-medium ${NOTE_STYLES[tone]}`}>{note}</p>
      </div>
    </div>
  );
}
