const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

/** Backend timestamps, shown in museum time. */
export function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormatter.format(date);
}

const dateOnlyFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
const timeOnlyFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" });

/** Date and time on separate lines, for narrow table columns. */
export function timestampParts(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: iso, time: "" };
  return { date: dateOnlyFormatter.format(date), time: timeOnlyFormatter.format(date) };
}
