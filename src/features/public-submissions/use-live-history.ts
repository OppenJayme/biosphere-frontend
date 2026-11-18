"use client";

import { useEffect, useState } from "react";
import { communicationHistorySchema, type CommunicationEntry } from "./history";

const REFRESH_MS = 30_000;
type Kind = "inquiry" | "visit";
type Snapshot = {
  kind: Kind;
  id: string;
  baseline: CommunicationEntry[] | null;
  history: CommunicationEntry[];
};

/**
 * Refresh only the selected curator conversation, not the entire dashboard.
 * Mailbox import runs independently on the NestJS backend. Failed polls retain
 * the last known history; changing records never displays another record's mail.
 *
 * `expectedEntryIds` are reply entries the bell already lists for this record. When one is not
 * on screen yet, the conversation is fetched at once instead of waiting for the next poll. A
 * reply that still does not appear is not refetched in a loop: the effect only reruns when the
 * set of missing ids changes.
 */
export function useLiveHistory(
  kind: Kind | null,
  id: string | null,
  initial: CommunicationEntry[] | null,
  expectedEntryIds: readonly string[] = [],
) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  // A new server-rendered history wins over any snapshot from a previous render.
  const shown =
    snapshot?.kind === kind && snapshot.id === id && snapshot.baseline === initial ? snapshot.history : initial;
  const missing = expectedEntryIds.filter((entryId) => !shown?.some((entry) => entry.id === entryId)).join(",");

  useEffect(() => {
    if (!kind || !id) return;

    const controller = new AbortController();
    let running = false;
    let active = true;

    const refresh = async () => {
      if (!active || running || document.visibilityState !== "visible" || !navigator.onLine) return;
      running = true;
      try {
        const response = await fetch(
          "/api/public-submissions/history/" + kind + "/" + encodeURIComponent(id),
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) return;
        const parsed = communicationHistorySchema.safeParse(await response.json());
        if (!active || !parsed.success) return;

        setSnapshot((previous) => {
          if (
            previous?.kind === kind &&
            previous.id === id &&
            previous.baseline === initial &&
            JSON.stringify(previous.history) === JSON.stringify(parsed.data)
          ) return previous;
          return { kind, id, baseline: initial, history: parsed.data };
        });
      } catch {
        // Offline, cancellation and temporary backend failures preserve the current conversation.
      } finally {
        running = false;
      }
    };

    if (missing) void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("online", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("online", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [kind, id, initial, missing]);

  return shown;
}
