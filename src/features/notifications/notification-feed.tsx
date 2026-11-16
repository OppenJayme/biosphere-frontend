/**
 * One curator notification feed for the whole workspace chrome. The top bar bell and the sidebar
 * badges both read it, so marking an alert read or clearing the list updates every count at once.
 *
 * The feed is polled while the tab is visible. Every change goes through the same-origin
 * /api/notifications route and is followed by a fresh read, so counts always come from the
 * backend rather than from a local guess.
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  NOTIFICATION_FEED_MAX,
  notificationFeedSchema,
  type CuratorNotification,
  type NotificationBulkState,
  type NotificationFeed,
} from "./types";

const REFRESH_MS = 60_000;

export type FeedState =
  | { status: "loading" }
  | { status: "ready"; feed: NotificationFeed }
  | { status: "error"; message: string };

/** What an update is in flight for: one notification's id, or the whole list. */
export type FeedUpdating = string | "ALL" | null;

type NotificationFeedValue = {
  state: FeedState;
  feed: NotificationFeed | null;
  updating: FeedUpdating;
  actionError: string | null;
  clearActionError: () => void;
  refresh: (preserveFeed?: boolean) => Promise<boolean>;
  /** Resolves true when the change was saved. */
  changeState: (item: CuratorNotification, next: "READ" | "DISMISSED") => Promise<boolean>;
  /** Applies one state to every notification. Resolves how many changed, or null if it failed. */
  changeAll: (next: NotificationBulkState) => Promise<number | null>;
};

const NotificationFeedContext = createContext<NotificationFeedValue | null>(null);

function updateErrorMessage(status: number) {
  if (status === 401) return "Your session expired. Sign in again.";
  if (status === 403) return "Your account cannot update notifications.";
  if (status === 404) return "This notification is no longer available. Refresh notifications.";
  return "The notification update could not be confirmed. Refresh notifications or try again.";
}

export function NotificationFeedProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const [updating, setUpdating] = useState<FeedUpdating>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const updatingRef = useRef(false);

  const refresh = useCallback(async (preserveFeed = false) => {
    if (updatingRef.current && !preserveFeed) return false;
    const version = ++requestVersion.current;
    try {
      // The largest page the backend allows, so the sidebar badges count every loaded alert.
      const response = await fetch(`/api/notifications?limit=${NOTIFICATION_FEED_MAX}`, { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (version !== requestVersion.current) return false;
      if (!response.ok) {
        const message =
          body && typeof body === "object" && "message" in body && typeof body.message === "string"
            ? body.message
            : "Notifications could not be loaded.";
        if (preserveFeed)
          setActionError(
            "The update may have saved, but the feed could not be refreshed. Refresh notifications or try again.",
          );
        else setState({ status: "error", message });
        return false;
      }
      const parsed = notificationFeedSchema.safeParse(body);
      if (!parsed.success && preserveFeed) {
        setActionError("The updated notification feed could not be confirmed. Refresh notifications.");
        return false;
      }
      setState(
        parsed.success
          ? { status: "ready", feed: parsed.data }
          : { status: "error", message: "Notifications could not be loaded." },
      );
      return parsed.success;
    } catch {
      if (version !== requestVersion.current) return false;
      if (preserveFeed)
        setActionError(
          "The update may have saved, but the feed could not be refreshed. Refresh notifications or try again.",
        );
      else setState({ status: "error", message: "Notifications could not be loaded. Check your connection." });
      return false;
    }
  }, []);

  /** Sends one PATCH and re-reads the feed. One update runs at a time. */
  const update = useCallback(
    async (marker: Exclude<FeedUpdating, null>, payload: unknown): Promise<Record<string, unknown> | null> => {
      if (updatingRef.current) return null;
      updatingRef.current = true;
      requestVersion.current++;
      setUpdating(marker);
      setActionError(null);
      try {
        const response = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body: unknown = await response.json().catch(() => null);
        const result = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
        if (!response.ok || !result) throw new Error(updateErrorMessage(response.status));
        // A bulk update can save some and fail others; re-read either way so counts stay true.
        await refresh(true);
        if (result.updated !== true) {
          throw new Error(
            typeof result.failed === "number" && result.failed > 0
              ? `${result.failed} ${result.failed === 1 ? "notification" : "notifications"} could not be updated. Try again.`
              : updateErrorMessage(response.status),
          );
        }
        return result;
      } catch (error) {
        setActionError(
          error instanceof TypeError
            ? "The notification update could not be confirmed. Check your connection, then refresh notifications or try again."
            : error instanceof Error
              ? error.message
              : "The notification update could not be confirmed.",
        );
        return null;
      } finally {
        updatingRef.current = false;
        setUpdating(null);
      }
    },
    [refresh],
  );

  const changeState = useCallback(
    async (item: CuratorNotification, next: "READ" | "DISMISSED") =>
      (await update(item.id, { notificationId: item.id, state: next })) !== null,
    [update],
  );

  const changeAll = useCallback(
    async (next: NotificationBulkState) => {
      const result = await update("ALL", { all: next });
      if (!result) return null;
      return typeof result.count === "number" ? result.count : 0;
    },
    [update],
  );

  // The service worker announces a push (public/sw.js); refresh at once instead of at the next poll.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === "BIOSPHERE_NOTIFICATIONS_CHANGED") void refresh();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refresh]);

  // Poll while the tab is visible, and refresh when the curator comes back to it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from an external source
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const value = useMemo<NotificationFeedValue>(
    () => ({
      state,
      feed: state.status === "ready" ? state.feed : null,
      updating,
      actionError,
      clearActionError: () => setActionError(null),
      refresh,
      changeState,
      changeAll,
    }),
    [state, updating, actionError, refresh, changeState, changeAll],
  );

  return <NotificationFeedContext.Provider value={value}>{children}</NotificationFeedContext.Provider>;
}

export function useNotificationFeed() {
  const value = useContext(NotificationFeedContext);
  if (!value) throw new Error("useNotificationFeed must be used inside NotificationFeedProvider.");
  return value;
}
