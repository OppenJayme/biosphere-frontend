import "server-only";

/**
 * Names for the records that audit entries point at. The audit API stores only a
 * record type and ID, so the page looks the names up through the existing read
 * endpoints (one call per record type, run in parallel) and the wording can say
 * which exhibit or specimen was changed. A failed or missing lookup simply leaves
 * that entry without a name; it never blocks the page.
 */

import { exhibitDisplayName } from "../exhibits-qr/types";
import { listExhibits } from "../exhibits-qr/api";
import { listInquiries } from "../inquiries/api";
import { getSpecimen, listCollections } from "../specimens/api";
import { listStorageLocations } from "../storage-locations/api";
import { listUserAccounts } from "../user-accounts/api";
import { listVisitRequests } from "../visit-requests/api";
import type { AuditLogEntry } from "./types";

/** Keyed by `${recordType}:${recordId}`. */
export type RecordLabels = Record<string, string>;

/** Individual specimen lookups are capped so one page never fans out into many calls. */
const MAX_SPECIMEN_LOOKUPS = 15;

export const recordLabelKey = (type: string, id: string) => `${type.toLowerCase()}:${id}`;

type Lookup = (ids: string[]) => Promise<Map<string, string>>;

const LOOKUPS: Record<string, Lookup> = {
  exhibit: async (ids) => {
    const exhibits = (await listExhibits()).filter((exhibit) => ids.includes(exhibit.id));
    const specimenIds = [...new Set(exhibits.map((exhibit) => exhibit.specimenId))].slice(0, MAX_SPECIMEN_LOOKUPS);
    const specimens = await Promise.allSettled(specimenIds.map((id) => getSpecimen(id)));
    const names = new Map<string, { commonName: string | null; scientificName: string | null; accessionNumber: string | null }>();
    specimens.forEach((result, index) => {
      if (result.status === "fulfilled") names.set(specimenIds[index], result.value);
    });
    return new Map(
      exhibits.map((exhibit) => [
        exhibit.id,
        exhibitDisplayName({ publicSlug: exhibit.publicSlug, specimen: names.get(exhibit.specimenId) ?? null }),
      ]),
    );
  },
  specimen: async (ids) => {
    const wanted = ids.slice(0, MAX_SPECIMEN_LOOKUPS);
    const results = await Promise.allSettled(wanted.map((id) => getSpecimen(id)));
    const labels = new Map<string, string>();
    results.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const { commonName, scientificName, accessionNumber } = result.value;
      const name = commonName ?? scientificName ?? accessionNumber;
      if (name) labels.set(wanted[index], name);
    });
    return labels;
  },
  storage_unit: async () => new Map((await listStorageLocations("ALL")).map((unit) => [unit.id, unit.label])),
  collection: async () => new Map((await listCollections()).map((item) => [item.id, item.collectionName])),
  user_account: async () => new Map((await listUserAccounts()).map((account) => [account.id, account.fullName])),
  inquiry: async () => new Map((await listInquiries()).map((inquiry) => [inquiry.id, inquiry.name])),
  visit_request: async () =>
    new Map((await listVisitRequests()).map((request) => [request.id, request.organization])),
};

export async function resolveAuditRecordLabels(entries: AuditLogEntry[]): Promise<RecordLabels> {
  const idsByType = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!entry.affectedRecordType || !entry.affectedRecordId) continue;
    const type = entry.affectedRecordType.toLowerCase();
    if (!LOOKUPS[type]) continue;
    const ids = idsByType.get(type) ?? new Set<string>();
    ids.add(entry.affectedRecordId);
    idsByType.set(type, ids);
  }

  const types = [...idsByType.keys()];
  const results = await Promise.allSettled(types.map((type) => LOOKUPS[type]([...idsByType.get(type)!])));

  const labels: RecordLabels = {};
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const type = types[index];
    for (const id of idsByType.get(type)!) {
      const label = result.value.get(id);
      if (label) labels[recordLabelKey(type, id)] = label;
    }
  });
  return labels;
}
