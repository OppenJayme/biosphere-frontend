/**
 * Links the bell and the open curator conversation. A VISITOR_REPLY alert is keyed
 * `VISITOR_REPLY:<communication entry id>`, so the bell can tell the conversation panel
 * which reply entries should already be on screen.
 */

import type { CuratorNotification } from "../notifications/types";
import type { CommunicationEntry } from "./history";

const REPLY_PREFIX = "VISITOR_REPLY:";

/** Timeline entry ids of the bell's unanswered visitor replies for one inquiry or visit request. */
export function replyEntryIdsFor(
  items: readonly CuratorNotification[] | null | undefined,
  kind: "inquiry" | "visit" | null,
  recordId: string | null,
): string[] {
  if (!items || !kind || !recordId) return [];
  const recordType = kind === "inquiry" ? "inquiry" : "visit_request";
  return items.flatMap((item) =>
    item.type === "VISITOR_REPLY" &&
    item.recordType === recordType &&
    item.recordId === recordId &&
    item.id.startsWith(REPLY_PREFIX)
      ? [item.id.slice(REPLY_PREFIX.length)]
      : [],
  );
}

/**
 * Which entries a conversation holds. A poll that returns the same entries in a new array keeps
 * the same signature, so only a real change (an entry added or removed) refreshes the bell.
 */
export function historySignature(history: readonly CommunicationEntry[] | null | undefined): string {
  return history ? history.map((entry) => entry.id).join(",") : "";
}
