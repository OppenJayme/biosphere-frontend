/** Building blocks shared by the inquiry and visit-request detail panels. */

"use client";

import { useActionState, useId, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { AlertTriangleIcon, ChatIcon, CheckIcon, ClockIcon, MailIcon, RefreshIcon } from "@/components/icons";
import type { CuratorActionState } from "@/features/public-submissions/email-form";
import { formatTimestamp } from "@/features/public-submissions/format";
import {
  EMAIL_SUBJECT_MAX,
  NOTE_MAX,
  VISITOR_MESSAGE_MAX,
  deliveryReason,
  deliveryStatus,
  entryTypeLabel,
  isOutboundEmail,
  readableHistoryMessage,
  type CommunicationEntry,
} from "@/features/public-submissions/history";

export type NoteState = CuratorActionState;
export type NoteAction = (previousState: NoteState, formData: FormData) => Promise<NoteState>;

export const panelClasses = "rounded-xl border border-black/10 bg-white p-4";
export const textareaClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";
export const primaryButtonClasses =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:opacity-60";
export const dangerButtonClasses =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:opacity-60";
export const secondaryButtonClasses =
  "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:opacity-60";

export function PanelHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
        <Icon className="h-4 w-4 text-forest-700" />
        {title}
      </h3>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2 text-xs">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-zinc-800">{children}</dd>
    </div>
  );
}

export function ActionError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
      <AlertTriangleIcon className="mt-px h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

/** Optional internal note recorded with a status change or approval. Never emailed. */
export function DecisionNote({
  defaultValue,
  label = "Internal note (optional)",
}: {
  defaultValue?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-zinc-700">
        {label}
      </label>
      <textarea
        id={id}
        name="note"
        rows={2}
        maxLength={NOTE_MAX}
        defaultValue={defaultValue}
        placeholder="For curators only; recorded on the timeline"
        className={textareaClasses}
      />
    </div>
  );
}

/**
 * "Notify visitor by email" (on by default) plus an optional message the visitor will read.
 * Kept visually separate from the internal note so curators don't email private remarks.
 */
export function VisitorEmailFields({
  recipient,
  defaultNotify = true,
  defaultMessage,
  onNotifyChange,
}: {
  recipient: string;
  defaultNotify?: boolean;
  defaultMessage?: string;
  onNotifyChange?: (notify: boolean) => void;
}) {
  const [notify, setNotify] = useState(defaultNotify);
  const id = useId();

  return (
    <div className="space-y-2 rounded-lg border border-black/10 p-3">
      <label htmlFor={`${id}-notify`} className="flex cursor-pointer items-start gap-2 text-xs text-zinc-800">
        <input
          id={`${id}-notify`}
          type="checkbox"
          name="notifyVisitor"
          checked={notify}
          onChange={(event) => {
            setNotify(event.target.checked);
            onNotifyChange?.(event.target.checked);
          }}
          className="mt-0.5 accent-forest-700"
        />
        <span>
          <span className="font-semibold">Notify visitor by email</span>
          <span className="block break-all text-zinc-500">{recipient}</span>
        </span>
      </label>
      {notify && (
        <div>
          <label htmlFor={`${id}-message`} className="text-xs font-medium text-zinc-700">
            Message to visitor (optional)
          </label>
          <textarea
            id={`${id}-message`}
            name="visitorMessage"
            rows={3}
            maxLength={VISITOR_MESSAGE_MAX}
            defaultValue={defaultMessage}
            placeholder="Included in the email. The visitor will read this."
            className={textareaClasses}
          />
        </div>
      )}
    </div>
  );
}

export type StatusOption = { value: string; label: string; description: string; destructive?: boolean };

/** Changes the workflow status to one of the transitions the backend allows from the current status. */
export function StatusChangeForm({
  action,
  options,
  recordLabel,
  visitorEmail,
}: {
  action: NoteAction;
  options: StatusOption[];
  recordLabel: string;
  /** When set, the statuses it accepts email the visitor, and the form offers the email fields. */
  visitorEmail?: { recipient: string; sendsFor: (status: string) => boolean };
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [choice, setChoice] = useState(options[0]?.value ?? "");
  const [notify, setNotify] = useState(state.notifyVisitor ?? true);
  const groupId = useId();
  const selected = options.find((option) => option.value === choice) ?? options[0];

  if (!selected) return null;
  const emailing = visitorEmail?.sendsFor(selected.value) ?? false;

  return (
    <form action={formAction} className={`${panelClasses} space-y-3`}>
      <PanelHeading
        icon={RefreshIcon}
        title="Change status"
        description={`Move this ${recordLabel} to its next workflow stage.`}
      />

      {options.length === 1 ? (
        <>
          <input type="hidden" name="status" value={selected.value} />
          <p className="rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-700">
            <span className="font-semibold text-zinc-900">{selected.label}.</span> {selected.description}
          </p>
        </>
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-medium text-zinc-700">New status</legend>
          {options.map((option) => (
            <label
              key={option.value}
              htmlFor={`${groupId}-${option.value}`}
              className="flex cursor-pointer gap-2.5 rounded-lg border border-black/10 px-3 py-2 text-xs has-checked:border-forest-700 has-checked:bg-forest-50"
            >
              <input
                id={`${groupId}-${option.value}`}
                type="radio"
                name="status"
                value={option.value}
                checked={choice === option.value}
                onChange={() => setChoice(option.value)}
                className="mt-0.5 accent-forest-700"
              />
              <span>
                <span className={`block font-semibold ${option.destructive ? "text-red-700" : "text-zinc-900"}`}>
                  {option.label}
                </span>
                <span className="text-zinc-500">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <DecisionNote defaultValue={state.note} />
      {emailing && visitorEmail && (
        <VisitorEmailFields
          recipient={visitorEmail.recipient}
          defaultNotify={notify}
          defaultMessage={state.visitorMessage}
          onNotifyChange={setNotify}
        />
      )}
      <ActionError message={state.message} />

      <ConfirmButton
        label={`Set to ${selected.label}`}
        question={`Change the status to ${selected.label}?`}
        detail={[
          selected.description,
          selected.destructive ? "This is final and cannot be undone." : "",
          emailing && visitorEmail
            ? notify
              ? `${visitorEmail.recipient} will be emailed about this decision.`
              : "The visitor will not be emailed."
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        confirmLabel={`Yes, set to ${selected.label}`}
        tone={selected.destructive ? "danger" : "default"}
        pending={pending}
        pendingLabel="Updating status…"
        className={selected.destructive ? dangerButtonClasses : primaryButtonClasses}
      />
    </form>
  );
}

/** A curator-written email to the visitor (an inquiry reply or a visit-request message). */
export function EmailVisitorForm({
  action,
  recipient,
  title,
  description,
  placeholder,
}: {
  action: NoteAction;
  recipient: string;
  title: string;
  description: string;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  return (
    <form action={formAction} className={`${panelClasses} space-y-3`}>
      <PanelHeading icon={MailIcon} title={title} description={description} />
      <p className="text-xs text-zinc-600">
        To: <span className="break-all font-medium text-zinc-900">{recipient}</span>
      </p>
      <div>
        <label htmlFor={`${id}-subject`} className="text-xs font-medium text-zinc-700">
          Subject (optional)
        </label>
        <input
          id={`${id}-subject`}
          name="subject"
          type="text"
          maxLength={EMAIL_SUBJECT_MAX}
          defaultValue={state.subject}
          placeholder="Defaults to one with the reference number"
          className={textareaClasses}
        />
      </div>
      <div>
        <label htmlFor={`${id}-body`} className="text-xs font-medium text-zinc-700">
          Message
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          rows={5}
          required
          maxLength={VISITOR_MESSAGE_MAX}
          defaultValue={state.body}
          placeholder={placeholder}
          className={textareaClasses}
        />
      </div>
      <ActionError message={state.message} />
      <ConfirmButton
        label={
          <>
            <MailIcon className="h-4 w-4" />
            Send email
          </>
        }
        question="Send this email?"
        detail={`It goes to ${recipient} and is recorded on the timeline. Emails cannot be recalled.`}
        confirmLabel="Yes, send email"
        pending={pending}
        pendingLabel="Sending email…"
        className={secondaryButtonClasses}
      />
    </form>
  );
}

/** Adds an internal curator note (e.g. what a visitor said by phone or in the museum's mailbox). */
export function NoteForm({ action }: { action: NoteAction }) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor={id} className="text-xs font-medium text-zinc-700">
        Add an internal note
      </label>
      <textarea
        id={id}
        name="note"
        rows={3}
        required
        maxLength={NOTE_MAX}
        defaultValue={state.note}
        placeholder="e.g. Visitor replied by email: the class size is now 25."
        className={textareaClasses}
      />
      <ActionError message={state.message} />
      <button type="submit" disabled={pending} className={secondaryButtonClasses}>
        <ChatIcon className="h-4 w-4" />
        {pending ? "Saving note…" : "Save note"}
      </button>
      <PendingOverlay pending={pending} label="Saving note…" />
    </form>
  );
}

function DeliveryBadge({ result }: { result: string | null }) {
  const status = deliveryStatus(result);
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
        <CheckIcon className="h-3 w-3" />
        Sent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
      <AlertTriangleIcon className="h-3 w-3" />
      {status === "not-sent" ? "Not sent" : "Email failed"}
    </span>
  );
}

function EmailEntryBody({ entry }: { entry: CommunicationEntry }) {
  const status = deliveryStatus(entry.deliveryResult);
  const reason = deliveryReason(entry.deliveryResult);
  return (
    <div className="mt-0.5 space-y-1 text-xs text-zinc-700">
      <p className="break-words">
        To <span className="break-all">{entry.recipientEmail ?? "the visitor"}</span>
        {entry.subject && (
          <>
            {" "}· <span className="font-medium">{entry.subject}</span>
          </>
        )}
      </p>
      {status !== "sent" && (
        <p className="rounded-md bg-red-50 px-2 py-1 text-red-800">
          The visitor did not receive this{reason ? ` (${reason})` : ""}. Any status change was still saved;
          send a message to try again.
        </p>
      )}
      <details>
        <summary className="cursor-pointer text-[11px] font-medium text-forest-700 hover:underline">
          Show email
        </summary>
        <p className="mt-1 max-h-60 overflow-y-auto whitespace-pre-line break-words rounded-md bg-sage-50 px-2 py-1.5">
          {entry.message}
        </p>
      </details>
    </div>
  );
}

/** The record's timeline, oldest first, opened by the visitor's own submission. */
export function HistoryTimeline({
  submittedAt,
  entries,
  statusLabels,
  currentAccountId,
}: {
  submittedAt: string;
  entries: CommunicationEntry[] | null;
  statusLabels: Record<string, string>;
  currentAccountId: string | null;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
        <ClockIcon className="h-3.5 w-3.5 text-forest-700" />
        History
      </p>
      {entries === null && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          The history could not be loaded. Reload the page to try again.
        </p>
      )}
      <ol className="mt-3 space-y-3 border-l border-black/10 pl-4">
        <li className="relative">
          <span aria-hidden className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
          <p className="text-xs font-semibold text-zinc-800">Submitted through the public website</p>
          <p className="text-[11px] text-zinc-500">{formatTimestamp(submittedAt)}</p>
        </li>
        {entries?.map((entry) => (
          <li key={entry.id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isOutboundEmail(entry) ? "bg-amber-500" : entry.type === "NOTE" ? "bg-sky-500" : "bg-forest-600"
              }`}
            />
            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-zinc-800">
              {entryTypeLabel(entry.type)}
              {isOutboundEmail(entry) && <DeliveryBadge result={entry.deliveryResult} />}
            </p>
            {isOutboundEmail(entry) ? (
              <EmailEntryBody entry={entry} />
            ) : (
              <p className="mt-0.5 whitespace-pre-line break-words text-xs text-zinc-700">
                {readableHistoryMessage(entry.message, statusLabels)}
              </p>
            )}
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {entry.recordedBy === currentAccountId ? "You" : "A curator"} · {formatTimestamp(entry.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
