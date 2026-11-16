"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  BellIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  ClipboardIcon,
  CloseIcon,
  DotsIcon,
  MoveIcon,
} from "@/components/icons";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { notify } from "@/components/ui/toast";
import { useNotificationFeed } from "@/features/notifications/notification-feed";
import {
  isChangeNotification,
  isFailureNotification,
  notificationBadge,
  notificationHref,
  notificationTypeLabel,
  type CuratorNotification,
} from "@/features/notifications/types";
import { LOCAL_SYNC_ALERT_HREF, withoutServerReported } from "@/features/notifications/local-alerts";
import { useLocalSyncAlerts } from "@/features/notifications/use-local-sync-alerts";
import { formatTimestamp } from "@/features/public-submissions/format";

function ItemIcon({ item }: { item: CuratorNotification }) {
  if (isFailureNotification(item.type)) {
    return <AlertTriangleIcon className="h-4 w-4 text-amber-700" />;
  }
  if (item.type === "RECORD_INCOMPLETE") {
    return <ClipboardIcon className="h-4 w-4 text-forest-700" />;
  }
  if (item.type === "SPECIMEN_ARCHIVED" || item.type === "SPECIMEN_RESTORED") {
    return <ArchiveIcon className="h-4 w-4 text-zinc-600" />;
  }
  if (isChangeNotification(item.type)) {
    return <MoveIcon className="h-4 w-4 text-zinc-600" />;
  }
  return item.type === "NEW_INQUIRY" ? (
    <ChatIcon className="h-4 w-4 text-forest-700" />
  ) : (
    <CalendarIcon className="h-4 w-4 text-forest-700" />
  );
}

/**
 * Topbar bell for new inquiries and visit requests, and undelivered submission emails
 * (REQ-4.3-05, REQ-4.8-08, REQ-4.9-07). The feed is derived from pending records; the
 * optional per-curator state keeps unread alerts separate from unresolved work.
 * Offline drafts that failed to sync on this device, or have waited more than a day to
 * sync, are added from IndexedDB (REQ-4.3-05/10): they stay visible while the backend feed
 * is unreachable, and they clear when the draft syncs or is discarded in the offline
 * workspace.
 */
export function NotificationBell({ ownerId }: { ownerId: string }) {
  const deviceAlerts = useLocalSyncAlerts(ownerId);
  // The feed is shared with the sidebar badges, so both update together.
  const { state, feed, updating, actionError, clearActionError, refresh, changeState, changeAll } =
    useNotificationFeed();
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  // True while a card's "..." menu is open. The menu is portalled outside the panel, so the
  // panel's own Escape and outside-click handling must wait until it closes. A ref, not state:
  // the menu closes during the same key or pointer event the panel's listeners then see.
  const cardMenuOpen = useRef(false);
  const setCardMenuOpen = (next: boolean) => {
    cardMenuOpen.current = next;
  };
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function markOne(item: CuratorNotification, next: "READ" | "DISMISSED") {
    if (await changeState(item, next)) {
      notify("success", next === "READ" ? "Notification marked as read." : "Notification dismissed.");
    }
  }

  async function markAllRead() {
    const count = await changeAll("READ");
    if (count === null) return;
    notify("success", count === 0 ? "There was nothing unread." : "All notifications were marked as read.");
  }

  async function clearAll() {
    setConfirmClear(false);
    const count = await changeAll("DISMISSED");
    if (count === null) return;
    notify("success", count === 1 ? "1 notification was cleared." : `${count} notifications were cleared.`);
  }

  // Close on Escape (returning focus to the bell) or on a click outside the panel.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // While the "Clear all" confirmation or a card menu is open, Escape closes that first.
      // Radix marks the Escape it used to close a menu as handled (defaultPrevented).
      if (event.key === "Escape" && !event.defaultPrevented && !confirmClear && !cardMenuOpen.current) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      // A click on (or away from) an open card menu only closes the menu.
      if (cardMenuOpen.current) return;
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, confirmClear]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void refresh();
  }

  const localAlerts = withoutServerReported(deviceAlerts, feed?.items ?? []);
  const feedCount = feed
    ? feed.stateManagementEnabled
      ? (feed.unreadTotal ?? 0)
      : feed.total
    : 0;
  const count = feedCount + localAlerts.length;
  const badge = notificationBadge(count);
  const label =
    count > 0
      ? `Notifications, ${count} ${feed?.stateManagementEnabled && localAlerts.length === 0 ? "unread" : "need attention"}`
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
            className="absolute -right-1.5 -top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[0.625rem] font-semibold leading-4 text-white ring-2 ring-white"
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
          {/* Summary sits under the title: it grows with each alert kind and
              wraps, so side by side it ran into the title. */}
          <div className="border-b border-black/10 px-4 py-3">
            <p className="text-sm font-semibold text-forest-900">
              Notifications
            </p>
            {feed && (
              <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                {feed.pendingInquiries} inquiries · {feed.pendingVisitRequests}{" "}
                visit requests pending
                {feed.operationalAlerts > 0 &&
                  ` · ${feed.operationalAlerts} unresolved ${feed.operationalAlerts === 1 ? "failure" : "failures"}`}
                {feed.incompleteRecords > 0 &&
                  ` · ${feed.incompleteRecords} uncataloged over 7 days`}
                {feed.changeEvents > 0 &&
                  ` · ${feed.changeEvents} recent ${feed.changeEvents === 1 ? "change" : "changes"}`}
              </p>
            )}
          </div>

          {feed?.stateManagementEnabled && feed.items.length > 0 && (
            <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-1.5 text-xs">
              <button
                type="button"
                disabled={updating !== null || (feed.unreadTotal ?? 0) === 0}
                onClick={() => void markAllRead()}
                className="rounded px-2 py-1 font-semibold text-forest-800 hover:bg-sage-100 focus-visible:outline-2 disabled:opacity-50"
              >
                Mark all as read
              </button>
              {updating === "ALL" && <span role="status">Updating…</span>}
              <button
                type="button"
                disabled={updating !== null}
                aria-haspopup="dialog"
                onClick={() => setConfirmClear(true)}
                className="rounded px-2 py-1 font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 disabled:opacity-50"
              >
                Clear all
              </button>
            </div>
          )}

          {localAlerts.length > 0 && (
            <ul
              aria-label="Alerts on this device"
              className="divide-y divide-black/5 border-b border-black/10"
            >
              {localAlerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={LOCAL_SYNC_ALERT_HREF}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 bg-amber-50/60 px-4 py-3 text-sm hover:bg-sage-50 focus-visible:bg-sage-50 focus-visible:outline-none"
                  >
                    <span className="mt-0.5 shrink-0">
                      <AlertTriangleIcon className="h-4 w-4 text-amber-700" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-zinc-900">
                        {alert.title}
                      </span>
                      <span className="block truncate text-xs text-zinc-600">
                        {alert.draftLabel}
                        {alert.reason ? ` · ${alert.reason}` : ""}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        This device · {formatTimestamp(alert.updatedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

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
          {feed && feed.items.length === 0 && localAlerts.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              {feed.stateManagementEnabled
                ? "No notifications to show. Pending work remains available in Public Website."
                : "You're all caught up. New requests, failures and specimen changes appear here."}
            </p>
          )}
          {feed && feed.items.length > 0 && (
            <ul className="max-h-96 divide-y divide-black/5 overflow-y-auto">
              {feed.items.map((item) => {
                // Read state exists only when per-curator state is on; without it every
                // item is simply pending work, so nothing is highlighted and there is no menu.
                const managed = feed.stateManagementEnabled;
                const unread = managed && !item.readAt;
                const failure = isFailureNotification(item.type);
                const menuItems: ActionMenuItem[] = [
                  ...(unread
                    ? [
                        {
                          label: "Mark as read",
                          icon: CheckIcon,
                          disabled: updating !== null,
                          onSelect: () => void markOne(item, "READ"),
                        },
                      ]
                    : []),
                  {
                    label: "Dismiss",
                    icon: CloseIcon,
                    disabled: updating !== null,
                    onSelect: () => void markOne(item, "DISMISSED"),
                  },
                ];
                // Unread cards are tinted (amber for failures) and keep it on hover; read cards
                // are plain, with failures still faintly amber.
                const tone = unread
                  ? failure
                    ? "bg-amber-50 hover:bg-amber-100/70 focus-visible:bg-amber-100/70"
                    : "bg-forest-50 hover:bg-forest-100/70 focus-visible:bg-forest-100/70"
                  : `${failure ? "bg-amber-50/40" : ""} hover:bg-sage-50 focus-visible:bg-sage-50`;
                return (
                  <li
                    key={item.id}
                    className={`group relative ${updating === item.id ? "opacity-60" : ""}`}
                  >
                    <Link
                      href={notificationHref(item)}
                      onClick={() => setOpen(false)}
                      className={`flex gap-3 py-3 pl-4 text-sm focus-visible:outline-none ${
                        managed ? "pr-[4.5rem]" : "pr-4"
                      } ${tone}`}
                    >
                      <span className="mt-0.5 shrink-0">
                        <ItemIcon item={item} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block ${
                            !managed
                              ? "font-medium text-zinc-900"
                              : unread
                                ? "font-semibold text-zinc-900"
                                : "text-zinc-700"
                          }`}
                        >
                          {unread && <span className="sr-only">Unread: </span>}
                          {item.title}
                        </span>
                        <span
                          className={`block text-xs ${
                            unread ? "font-semibold text-forest-700" : "text-zinc-500"
                          }`}
                        >
                          {notificationTypeLabel(item.type)} · {formatTimestamp(item.createdAt)}
                        </span>
                      </span>
                    </Link>
                    {managed && (
                      // Sits over the card's right edge; only the menu button takes clicks, so
                      // the rest of the card still opens the record.
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2">
                        <ActionMenu
                          trigger={<DotsIcon className="h-4 w-4 rotate-90" />}
                          // The reference stays in the accessible name only, to tell same-titled alerts apart.
                          label={`More actions: ${item.title} (${item.referenceCode})`}
                          items={menuItems}
                          onOpenChange={setCardMenuOpen}
                          // Shown on hover or keyboard focus, like a social feed; always shown
                          // on touch screens, which have no hover.
                          className="pointer-events-auto rounded-full border border-black/10 bg-white p-1.5 text-zinc-600 opacity-0 shadow-sm transition-opacity hover:bg-sage-100 hover:text-forest-800 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-forest-700 group-hover:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100"
                        />
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 rounded-full ${unread ? "bg-forest-700" : ""}`}
                        />
                      </div>
                    )}
                    {updating === item.id && (
                      <span role="status" className="sr-only">
                        Updating notification…
                      </span>
                    )}
                  </li>
                );
              })}
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
                  clearActionError();
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

      <ConfirmDialog
        open={confirmClear}
        title="Clear all notifications?"
        message={`${feed && feed.total === 1 ? "1 notification is" : `All ${feed?.total ?? 0} notifications are`} removed from your list. This affects only your account: pending inquiries, visit requests and unresolved failures are not changed. It cannot be undone.`}
        confirmLabel="Clear all"
        tone="danger"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => void clearAll()}
      />
    </div>
  );
}
