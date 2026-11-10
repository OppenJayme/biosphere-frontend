import type { AuditLogEntry } from "./types";

/** The looked-up name for an entry's record, if any (see record-labels.ts). */
export function labelFor(
  labels: Record<string, string>,
  entry: Pick<AuditLogEntry, "affectedRecordType" | "affectedRecordId">,
): string | undefined {
  if (!entry.affectedRecordType || !entry.affectedRecordId) return undefined;
  return labels[`${entry.affectedRecordType.toLowerCase()}:${entry.affectedRecordId}`];
}
