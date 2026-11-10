import { EXHIBIT_LAYOUT_LABELS, exhibitLayout, type ExhibitStatus } from "@/features/exhibits-qr/types";

export const STATUS_STYLES: Record<ExhibitStatus, string> = {
  PUBLISHED: "bg-forest-100 text-forest-700",
  UNPUBLISHED: "bg-zinc-100 text-zinc-600",
  DISABLED: "bg-amber-100 text-amber-700",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Manila",
});

export function formatExhibitDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMAT.format(date);
}

export function layoutLabel(layoutType: string | null) {
  return EXHIBIT_LAYOUT_LABELS[exhibitLayout(layoutType)];
}
