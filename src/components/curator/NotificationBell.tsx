"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  BellIcon,
  CalendarIcon,
  ChatIcon,
} from "@/components/icons";
import {
  notificationBadge,
  notificationFeedSchema,
  notificationHref,
  type CuratorNotification,
  type NotificationFeed,
} from "@/features/notifications/types";
import { formatTimestamp } from "@/features/public-submissions/format";

const REFRESH_MS = 60_000;

type FeedState =
  | { status: "loading" }
  | { status: "ready"; feed: NotificationFeed }
  | { status: "error"; message: string };

function ItemIcon({ item }: { item: CuratorNotification }) {
  if (item.type === "SUBMISSION_EMAIL_FAILED") {
    return <AlertTriangleIcon className="h-4 w-4 text-amber-700" />;
  }
  return item.type === "NEW_INQUIRY" ? (
    <ChatIcon className="h-4 w-4 text-forest-700" />
  ) : (
    <CalendarIcon className="h-4 w-4 text-forest-700" />
  );
}

/**
 * Topbar bell for new inquiries and visit requests, and undelivered submission emails
 * (REQ-4.3-05, REQ-4.8-08, REQ-4.9-07). The feed is derived from pending records, so an
 * The optional per-curator state keeps unread alerts separate from unresolved work.
 */
export function NotificationBell() {
  const [state, setState] = useState<FeedState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const requestVersion = useRef(0);
  const updatingRef = useRef(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async (preserveFeed = false) => {
    if (updatingRef.current && !preserveFeed) return false;
    const version = ++requestVersion.current;
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const body: unknown = await response.json().catch(() => null);
      if (version !== requestVersion.current) return false;
      if (!response.ok) {
        const message =
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof body.message === "string"
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
        setActionError(
          "The updated notification feed could not be confirmed. Refresh notifications.",
        );
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
      else
        setState({
          status: "error",
          message: "Notifications could not be loaded. Check your connection.",
        });
      return false;
    }
  }, []);

  async function changeState(
    item: CuratorNotification,
    next: "READ" | "DISMISSED",
  ) {
    if (updatingRef.current) return;
    updatingRef.current = true;
    requestVersion.current++;
    setUpdating(item.id);
    setActionError(null);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: item.id, state: next }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (
        !response.ok ||
        !body ||
        typeof body !== "object" ||
        !("updated" in body) ||
        body.updated !== true
      ) {
        const message =
          response.status === 401
            ? "Your session expired. Sign in again."
            : response.status === 403
              ? "Your account cannot update notifications."
              : response.status === 404
                ? "This notification is no longer available. Refresh notifications."
                : "The notification update could not be confirmed. Refresh notifications or try again.";
        throw new Error(message);
      }
      await refresh(true);
    } catch (error) {
      setActionError(
        error instanceof TypeError
          ? "The notification update could not be confirmed. Check your connection, then refresh notifications or try again."
          : error instanceof Error
            ? error.message
            : "The notification update could not be confirmed.",
      );
    } finally {
      updatingRef.current = false;
      setUpdating(null);
    }
  }

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

  // Close on Escape (returning focus to the bell) or on a click outside the panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void refresh();
  }

  const feed = state.status === "ready" ? state.feed : null;
  const count = feed
    ? feed.stateManagementEnabled
      ? (feed.unreadTotal ?? 0)
      : feed.total
    : 0;
  const badge = notificationBadge(count);
  const label =
    count > 0
      ? `Notifications, ${count} ${feed?.stateManagementEnabled ? "unread" : "need attention"}`
      : "Notifications";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="relative rounded-lg p-1 text-zinc-600 hover:bg-sage-100 hover:text-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
      >
        <BellIcon className="h-5 w-5" />
        {badge && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-semibold leading-4 text-white ring-2 ring-white"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg"
        >
          <div className="flex items-baseline justify-between border-b border-black/10 px-4 py-3">
            <p className="text-sm font-semibold text-forest-900">
              Notifications
            </p>
            {feed && (
              <p className="text-xs text-zinc-500">
                {feed.pendingInquiries} inquiries · {feed.pendingVisitRequests}{" "}
                visit requests pending
              </p>
            )}
          </div>

          {state.status === "loading" && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Loading…
            </p>
          )}
          {state.status === "error" && (
            <div role="alert" className="px-4 py-4 text-sm text-amber-950">
              <p>{state.message}</p>
              <button
                type="button"
                onClick={() => void refresh()}
                className="mt-2 font-semibold text-forest-700 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          )}
          {feed && feed.items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              {feed.stateManagementEnabled
                ? "No notifications to show. Pending work remains available in Public Website."
                : "You're all caught up. New inquiries and visit requests appear here."}
            </p>
          )}
          {feed && feed.items.length > 0 && (
            <ul className="max-h-96 divide-y divide-black/5 overflow-y-auto">
              {feed.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={notificationHref(item)}
                    onClick={() => setOpen(false)}
                    className={`flex gap-3 px-4 py-3 text-sm hover:bg-sage-50 focus-visible:bg-sage-50 focus-visible:outline-none ${
                      item.type === "SUBMISSION_EMAIL_FAILED"
                        ? "bg-amber-50/60"
                        : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      <ItemIcon item={item} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-zinc-900">
                        {item.title}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Ref{" "}
                        <span className="font-mono">{item.referenceCode}</span>{" "}
                        · {formatTimestamp(item.createdAt)}
                      </span>
                    </span>
                  </Link>
                  {feed.stateManagementEnabled && (
                    <div className="flex items-center gap-3 px-4 pb-3 text-xs">
                      {item.readAt ? (
                        <span className="text-zinc-500">Read</span>
                      ) : (
                        <button
                          type="button"
                          disabled={updating !== null}
                          aria-label={`Mark as read: ${item.title} (${item.referenceCode})`}
                          onClick={() => void changeState(item, "READ")}
                          className="rounded px-2 py-1 font-semibold text-forest-800 hover:bg-sage-100 focus-visible:outline-2 disabled:opacity-50"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updating !== null}
                        aria-label={`Dismiss: ${item.title} (${item.referenceCode})`}
                        onClick={() => void changeState(item, "DISMISSED")}
                        className="rounded px-2 py-1 font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:outline-2 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      {updating === item.id && (
                        <span role="status">Updating notification…</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {actionError && (
            <div
              role="alert"
              className="border-t border-black/10 px-4 py-3 text-sm text-amber-950"
            >
              <p>{actionError}</p>
              <button
                type="button"
                disabled={updating !== null}
                onClick={() => {
                  setActionError(null);
                  void refresh(true);
                }}
                className="mt-2 rounded px-2 py-1 font-semibold hover:bg-amber-50 disabled:opacity-50"
              >
                Refresh notifications
              </button>
            </div>
          )}

          {feed && feed.total > feed.items.length && (
            <p className="border-t border-black/10 px-4 py-2 text-xs text-zinc-500">
              Showing the {feed.items.length} newest of {feed.total}.
            </p>
          )}
          <p className="border-t border-black/10 px-4 py-2 text-xs text-zinc-500">
            {feed?.stateManagementEnabled
              ? "Read and dismissed alerts affect only your account. Pending work is unchanged."
              : "Alerts clear once a curator reviews or decides the record."}
          </p>
        </div>
      )}
    </div>
  );
}
