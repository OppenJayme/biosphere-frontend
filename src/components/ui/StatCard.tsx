import Link from "next/link";
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

const NOTE_STYLES = {
  positive: "text-forest-700",
  warning: "text-amber-600",
  danger: "text-red-600",
  neutral: "text-zinc-500",
} as const;

/**
 * Quiet summary number: label, value, and a short note. The icon is a small muted
 * marker, not a coloured badge, so a row of cards reads as one calm group.
 */
export function StatCard({
  label,
  value,
  note,
  tone,
  icon,
  href,
}: {
  label: string;
  value: string;
  note: string;
  tone: keyof typeof NOTE_STYLES;
  icon: keyof typeof ICONS;
  /** Makes the whole card a link to the related list. */
  href?: string;
}) {
  const Icon = ICONS[icon];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-zinc-600">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
      </div>
      <p className="mt-1 truncate text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      <p className={`mt-1 text-xs font-medium ${NOTE_STYLES[tone]}`}>{note}</p>
    </>
  );
  const classes = "block rounded-xl border border-black/10 bg-white px-5 py-4";

  return href ? (
    <Link
      href={href}
      className={`${classes} transition-colors hover:border-forest-700/40 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700`}
    >
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
