/**
 * Plain-language wording for audit entries, shared by the Audit Logs page and the
 * dashboard's recent activity. Curator screens show what happened as one sentence
 * ("Maria Santos archived the exhibit.") instead of raw action codes, record IDs and
 * JSON details. Internal identifiers stay in the backend record; they are filtered
 * out of everything returned here.
 */

import type { AuditLogEntry } from "./types";

/** Acronyms kept upper-case when an action or field code is turned into words. */
const ACRONYMS = new Set(["ar", "faq", "url", "qr", "id", "csv", "pdf", "docx", "api"]);

/** Past and base form for the first word of an action code, e.g. ARCHIVE_EXHIBIT. */
const VERBS: Record<string, [past: string, base: string]> = {
  ACTIVATE: ["activated", "activate"],
  ADD: ["added", "add"],
  ADJUST: ["adjusted", "adjust"],
  ALERT: ["alerted", "alert"],
  APPROVE: ["approved", "approve"],
  ARCHIVE: ["archived", "archive"],
  ATTACH: ["attached", "attach"],
  CHANGE: ["changed", "change"],
  CLEANUP: ["cleaned up", "clean up"],
  COMPLETE: ["completed", "complete"],
  CREATE: ["created", "create"],
  DEACTIVATE: ["deactivated", "deactivate"],
  DETACH: ["detached", "detach"],
  DISABLE: ["disabled", "disable"],
  EMAIL: ["emailed", "email"],
  ENABLE: ["enabled", "enable"],
  GENERATE: ["generated", "generate"],
  IMPORT: ["imported", "import"],
  INVITE: ["invited", "invite"],
  MOVE: ["moved", "move"],
  ONBOARD: ["onboarded", "onboard"],
  PUBLISH: ["published", "publish"],
  READ: ["opened", "open"],
  REFER: ["referred", "refer"],
  REMOVE: ["removed", "remove"],
  REOPEN: ["reopened", "reopen"],
  REPLACE: ["replaced", "replace"],
  RESTORE: ["restored", "restore"],
  REVIEW: ["reviewed", "review"],
  SELECT: ["selected", "select"],
  SET: ["set", "set"],
  SUBMIT: ["submitted", "submit"],
  SYNC: ["synced", "sync"],
  UNPUBLISH: ["unpublished", "unpublish"],
  UPDATE: ["updated", "update"],
  WITHDRAW: ["withdrew", "withdraw"],
};

/** Verbs whose object is usually a new record ("created a specimen lot"). */
const INDEFINITE_ARTICLE_VERBS = new Set(["CREATE", "GENERATE", "IMPORT", "INVITE", "ONBOARD", "SUBMIT", "ADD"]);
/** Objects that read naturally without an article ("added exhibit media"). */
const MASS_NOUN_ENDINGS = ["media", "notes", "quantity", "condition", "status", "display", "selection"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** "SPECIMEN_LOT_QUANTITY" or "affectedRecordType" -> "specimen lot quantity" (acronyms kept). */
export function humanizeCode(code: string): string {
  return code
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean)
    .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word.toLowerCase()))
    .join(" ");
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function withArticle(verb: string, object: string): string {
  if (!object) return "";
  if (MASS_NOUN_ENDINGS.some((ending) => object.endsWith(ending)) && verb !== "UPDATE") return object;
  if (INDEFINITE_ARTICLE_VERBS.has(verb)) return `${/^[aeiou]/i.test(object) ? "an" : "a"} ${object}`;
  return `the ${object}`;
}

function detailString(details: unknown, key: string): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const value = (details as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function subject(entry: Pick<AuditLogEntry, "actor" | "action">): string {
  if (entry.actor) return entry.actor.fullName;
  return entry.action.startsWith("SUBMIT_") ? "A visitor" : "The system";
}

/**
 * Hand-written wording for actions whose code reads awkwardly when split into words.
 * `{t}` is replaced by the record ("the exhibit “African Lion”", or "the exhibit"
 * when the name is unknown).
 */
const PHRASES: Record<string, [past: string, base: string]> = {
  ENABLE_EXHIBIT_AR: ["turned on AR for {t}", "turn on AR for {t}"],
  DISABLE_EXHIBIT_AR: ["turned off AR for {t}", "turn off AR for {t}"],
  SELECT_EXHIBIT_FOR_AR: ["marked {t} for AR", "mark {t} for AR"],
  WITHDRAW_EXHIBIT_AR_SELECTION: ["withdrew the AR selection for {t}", "withdraw the AR selection for {t}"],
  UPDATE_EXHIBIT_AR_SELECTION: ["updated the AR note for {t}", "update the AR note for {t}"],
  REPLACE_EXHIBIT_URL: ["changed the web address of {t}", "change the web address of {t}"],
  ADD_EXHIBIT_MEDIA: ["added a photo or video to {t}", "add a photo or video to {t}"],
  REMOVE_EXHIBIT_MEDIA: ["removed a photo or video from {t}", "remove a photo or video from {t}"],
  UPDATE_EXHIBIT_MEDIA: ["edited a photo or video on {t}", "edit a photo or video on {t}"],
  SET_SPECIMEN_PUBLIC_DISPLAY: ["changed whether {t} can be shown publicly", "change whether {t} can be shown publicly"],
  SET_SPECIMEN_MEDIA_COVER: ["chose a new cover photo for {t}", "choose a new cover photo for {t}"],
  COMPLETE_SPECIMEN_CATALOGING: ["finished cataloging {t}", "finish cataloging {t}"],
  REOPEN_SPECIMEN_CATALOGING: ["reopened cataloging for {t}", "reopen cataloging for {t}"],
  RESTORE_SPECIMEN: ["restored {t} from the archive", "restore {t} from the archive"],
  UPDATE_INQUIRY_STATUS: ["changed the status of {t}", "change the status of {t}"],
  UPDATE_VISIT_REQUEST_STATUS: ["changed the status of {t}", "change the status of {t}"],
  APPROVE_VISIT_SCHEDULE: ["approved a visit date for {t}", "approve a visit date for {t}"],
  REFER_INQUIRY: ["turned {t} into a visit request", "turn {t} into a visit request"],
  ADD_INQUIRY_NOTE: ["added a note to {t}", "add a note to {t}"],
  ADD_VISIT_REQUEST_NOTE: ["added a note to {t}", "add a note to {t}"],
  EMAIL_VISITOR: ["emailed the visitor about {t}", "email the visitor about {t}"],
  UPDATE_CURATOR_STATUS: ["changed the account status of {t}", "change the account status of {t}"],
  INVITE_CURATOR: ["invited {t} as a curator", "invite {t} as a curator"],
  ONBOARD_CURATOR: ["set up {t} as a curator", "set up {t} as a curator"],
  SUBMIT_INQUIRY: ["sent a general inquiry", "send a general inquiry"],
  SUBMIT_VISIT_REQUEST: ["sent a visit request", "send a visit request"],
  GENERATE_REPORT: ["generated a report", "generate a report"],
  SYNC_OFFLINE_SPECIMEN_DRAFT: ["uploaded a specimen draft made offline", "upload a specimen draft made offline"],
  READ_FAQ_REVIEW_QUEUE: ["opened the list of unanswered FAQ questions", "open the list of unanswered FAQ questions"],
};

/** How each record type is named when its label is unknown, and whether the label is a person. */
const RECORD_NOUNS: Record<string, { noun: string; person?: boolean }> = {
  exhibit: { noun: "the exhibit" },
  specimen: { noun: "the specimen" },
  storage_unit: { noun: "the storage location" },
  collection: { noun: "the collection" },
  inquiry: { noun: "a general inquiry", person: true },
  visit_request: { noun: "a visit request", person: true },
  user_account: { noun: "a curator account", person: true },
};

/** "the exhibit “African Lion”", "the general inquiry from Juan Cruz", or the bare noun without a name. */
function recordTarget(type: string | null | undefined, label: string | undefined): string | null {
  const key = type?.toLowerCase();
  const known = key ? RECORD_NOUNS[key] : undefined;
  if (!known) return label ? `“${label}”` : null;
  if (!label) return known.noun;
  if (key === "user_account") return label;
  if (known.person) return `${known.noun.replace(/^an? /, "the ")} from ${label}`;
  return `${known.noun} “${label}”`;
}

/** Fallback when an entry has no record type: the record noun named in the action code. */
function recordTypeFromAction(action: string): string | null {
  if (action.includes("EXHIBIT")) return "exhibit";
  if (action.includes("VISIT_REQUEST") || action.includes("VISIT_SCHEDULE")) return "visit_request";
  if (action.includes("INQUIRY")) return "inquiry";
  if (action.includes("CURATOR")) return "user_account";
  if (action.includes("SPECIMEN")) return "specimen";
  return null;
}

/** First segment of an API path, as the page a curator would recognise. */
const PATH_PAGES: Record<string, string> = {
  dashboard: "the Dashboard",
  "audit-logs": "the Audit Log",
  "storage-locations": "Locations",
  exhibits: "QR Exhibits",
  inquiries: "General Inquiries",
  "visit-requests": "Visit Requests",
  reports: "Reports",
  specimens: "Specimens",
  faq: "FAQ Knowledge",
  users: "Users",
  accounts: "Users",
  backups: "Backups",
};

function pageForPath(path: string): string {
  const first = path.replace(/^\/+/, "").split(/[/?]/)[0];
  return PATH_PAGES[first] ?? path;
}

/** Actions that change a record's status, where "It was … before" adds useful context. */
const STATUS_VERBS = new Set(["PUBLISH", "UNPUBLISH", "DISABLE", "ENABLE", "ARCHIVE", "RESTORE", "ACTIVATE", "DEACTIVATE"]);

type DescribableEntry = Pick<AuditLogEntry, "actor" | "action" | "details" | "result"> &
  Partial<Pick<AuditLogEntry, "affectedRecordType">>;

/**
 * One sentence describing who did what, to which record, and how it ended.
 * `label` is the record's name when the page could look it up.
 */
export function describeAuditEntry(entry: DescribableEntry, label?: string): string {
  const who = subject(entry);

  if (entry.action === "LOGIN") {
    return entry.result === "SUCCESS" ? `${who} signed in.` : `${who} could not sign in.`;
  }
  if (entry.action === "LOGIN_DENIED") {
    const reason = detailString(entry.details, "reason");
    const name = entry.actor ? `${entry.actor.fullName}'s sign-in` : "A sign-in attempt";
    return `${name} was blocked${reason ? ` (${humanizeCode(reason)})` : ""}.`;
  }
  if (entry.action === "ACCESS_DENIED") {
    const path = detailString(entry.details, "path");
    const page = path ? ` from ${pageForPath(path)}` : "";
    const because = detailString(entry.details, "role") === "DEVELOPER" ? " (developer accounts can't open it)" : "";
    return `${who} was blocked${page}${because}.`;
  }

  const target = recordTarget(entry.affectedRecordType ?? recordTypeFromAction(entry.action), label);
  const [verbCode, ...rest] = entry.action.split("_");
  const phrase = PHRASES[entry.action];
  let past: string;
  let base: string;
  if (phrase) {
    const fill = (text: string) => text.replace("{t}", target ?? "the record");
    past = fill(phrase[0]);
    base = fill(phrase[1]);
  } else {
    const verb = VERBS[verbCode];
    if (!verb) {
      // Unknown action code: still readable, never a raw code.
      const action = humanizeCode(entry.action);
      if (entry.result === "SUCCESS") return `${who}: ${action}.`;
      return `${who}: ${action} (${entry.result === "DENIED" ? "denied" : "failed"}).`;
    }
    const objectWords = humanizeCode(rest.join("_"));
    const recordWords = entry.affectedRecordType ? humanizeCode(entry.affectedRecordType) : "";
    // When the action is about the record itself ("ARCHIVE_EXHIBIT"), name it in place.
    const object =
      label && target && objectWords === recordWords
        ? target
        : [withArticle(verbCode, objectWords), label && target ? `for ${target}` : ""].filter(Boolean).join(" ");
    past = object ? `${verb[0]} ${object}` : verb[0];
    base = object ? `${verb[1]} ${object}` : verb[1];
  }

  if (entry.result === "DENIED") return `${who} was not allowed to ${base}.`;
  if (entry.result === "FAILED") return `${who} tried to ${base}, but it failed.`;

  const previous = detailString(entry.details, "previousStatus");
  const before = previous && STATUS_VERBS.has(verbCode) ? ` It was ${capitalize(humanizeCode(previous))} before.` : "";
  return `${who} ${past}.${before}`;
}

/** Module code -> label shown in tables and filters ("visit-requests" -> "Visit requests"). */
export function moduleLabel(module: string): string {
  return capitalize(humanizeCode(module));
}

/** Identifiers and contact addresses stay in the stored record, not on screen. */
function isHiddenKey(key: string): boolean {
  return /(^id$|Id$|Ids$|_id$|_ids$)/.test(key) || /email/i.test(key);
}

function formatDetailValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    if (UUID_PATTERN.test(value)) return null;
    return /^[A-Z][A-Z0-9_]+$/.test(value) ? capitalize(humanizeCode(value)) : value;
  }
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const parts = value.map(formatDetailValue).filter((part): part is string => part !== null);
    return parts.length ? parts.join(", ") : null;
  }
  return null;
}

/**
 * Readable label/value pairs from an entry's recorded details, without identifiers
 * (keys such as `assetIds`, or any UUID value), email addresses or nested JSON.
 */
export function auditDetailRows(details: unknown): { label: string; value: string }[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  return Object.entries(details as Record<string, unknown>).flatMap(([key, value]) => {
    if (isHiddenKey(key)) return [];
    const formatted = formatDetailValue(value);
    return formatted ? [{ label: capitalize(humanizeCode(key)), value: formatted }] : [];
  });
}
