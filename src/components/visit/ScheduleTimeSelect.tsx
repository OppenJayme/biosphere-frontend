import type { SelectHTMLAttributes } from "react";
import { formatScheduleTime, type TimeOption } from "@/features/public-submissions/schedule";

/**
 * A 12-hour time picker for a preferred-schedule row. Native time inputs follow the browser's
 * locale and often show 24-hour time beside hours written as "1:00 to 4:00 PM", so the forms use a
 * plain select instead: it keeps keyboard access and its label, and submits "HH:MM" as before.
 *
 * Booked or already-passed times arrive as disabled options: still listed, never selectable.
 *
 * A chosen time that is no longer offered (the visitor changed the date to one with shorter hours)
 * stays listed, so the select never silently changes it; validation explains the problem instead.
 */
export function ScheduleTimeSelect({
  options,
  value,
  defaultValue,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "value" | "defaultValue"> & {
  options: readonly TimeOption[];
  value?: string;
  defaultValue?: string;
}) {
  const current = value ?? defaultValue ?? "";
  const listed =
    current && !options.some((option) => option.value === current)
      ? [...options, { value: current, label: formatScheduleTime(current) }].sort((a, b) => a.value.localeCompare(b.value))
      : options;
  return (
    <select {...props} {...(value !== undefined ? { value } : { defaultValue: current })}>
      <option value="">Select a time</option>
      {listed.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
