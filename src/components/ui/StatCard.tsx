import {
  PawIcon,
  MailIcon,
  LockIcon,
  ShieldIcon,
  QrCodeIcon,
  CubeIcon,
  ScanIcon,
  DocumentTextIcon,
  ClipboardIcon,
  ClockIcon,
  ChartBarIcon,
  GridIcon,
  CalendarIcon,
  DownloadIcon,
} from "@/components/icons";

const ICONS = {
  specimen: PawIcon,
  mail: MailIcon,
  lock: LockIcon,
  shield: ShieldIcon,
  qr: QrCodeIcon,
  cube: CubeIcon,
  scan: ScanIcon,
  ar: CubeIcon,
  draft: DocumentTextIcon,
  log: ClipboardIcon,
  clock: ClockIcon,
  chart: ChartBarIcon,
  table: GridIcon,
  calendar: CalendarIcon,
  export: DownloadIcon,
} as const;

const ICON_STYLES: Record<keyof typeof ICONS, string> = {
  specimen: "bg-forest-100 text-forest-700",
  mail: "bg-amber-100 text-amber-600",
  lock: "bg-red-100 text-red-600",
  shield: "bg-amber-100 text-amber-600",
  qr: "bg-violet-100 text-violet-600",
  cube: "bg-sage-100 text-forest-700",
  scan: "bg-gold-100 text-gold-700",
  ar: "bg-red-100 text-red-600",
  draft: "bg-amber-100 text-amber-600",
  log: "bg-sage-100 text-forest-700",
  clock: "bg-sage-100 text-forest-700",
  chart: "bg-sage-100 text-forest-700",
  table: "bg-gold-100 text-gold-700",
  calendar: "bg-sky-100 text-sky-700",
  export: "bg-violet-100 text-violet-600",
};

const NOTE_STYLES = {
  positive: "text-forest-700",
  warning: "text-amber-600",
  danger: "text-red-600",
  neutral: "text-zinc-500",
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
        <p className="truncate text-2xl font-semibold text-zinc-900">{value}</p>
        <p className={`text-xs font-medium ${NOTE_STYLES[tone]}`}>{note}</p>
      </div>
    </div>
  );
}
