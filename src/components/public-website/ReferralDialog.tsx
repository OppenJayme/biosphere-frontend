/**
 * "Turn into visit request" (REQ-4.8-07): the curator fills in the visit details an inquiry lacks.
 * The new request starts as Pending and still needs a schedule approved; it is never auto-approved.
 */

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CalendarIcon, CloseIcon, PlusIcon } from "@/components/icons";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import type { ReferralActionState } from "@/features/inquiries/actions";
import type { Inquiry } from "@/features/inquiries/types";
import { NOTE_MAX } from "@/features/public-submissions/history";
import { MAX_PREFERRED_SCHEDULES, MAX_VISITOR_COUNT, museumToday } from "@/features/public-submissions/schedule";
import { ActionError, primaryButtonClasses, secondaryButtonClasses, textareaClasses } from "./DetailParts";

type ReferralAction = (previousState: ReferralActionState, formData: FormData) => Promise<ReferralActionState>;

const inputClasses = textareaClasses;

let rowIdCounter = 0;
const nextRowIds = (count: number) =>
  Array.from({ length: Math.max(1, count) }, () => {
    rowIdCounter += 1;
    return rowIdCounter;
  });

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

function invalidProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": id } : {};
}

export function ReferralDialog({ inquiry, action }: { inquiry: Inquiry; action: ReferralAction }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, {});
  const [rowIds, setRowIds] = useState(() => nextRowIds(1));
  const [seenState, setSeenState] = useState(state);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const today = museumToday();
  const values = state.values;
  const errors = state.errors ?? {};

  // After a failed submit, match the schedule rows to what the curator had entered.
  if (state !== seenState) {
    setSeenState(state);
    if (values) setRowIds(nextRowIds(values.scheduleDate.length));
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  const id = (name: string) => `${fieldId}-${name}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={secondaryButtonClasses}
      >
        <CalendarIcon className="h-4 w-4" />
        Turn into visit request
      </button>

      <PendingOverlay pending={pending} label="Creating visit request…" />

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm"
      >
        {open && (
          <form action={formAction} noValidate className="max-h-[85vh] space-y-4 overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
                  Turn into a visit request
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Creates a <strong>Pending</strong> visit request for {inquiry.name} and marks this inquiry
                  as turned into a visit request. You will still need to approve a schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-sage-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={id("phone")} className="text-xs font-medium text-zinc-700">
                  Contact number{inquiry.phone ? " (defaults to the inquiry's)" : ""}
                </label>
                <input
                  id={id("phone")}
                  name="phone"
                  type="tel"
                  maxLength={20}
                  defaultValue={values?.phone ?? inquiry.phone ?? ""}
                  className={inputClasses}
                  {...invalidProps(id("phone-error"), errors.phone)}
                />
                <FieldMessage id={id("phone-error")} message={errors.phone} />
              </div>
              <div>
                <label htmlFor={id("organization")} className="text-xs font-medium text-zinc-700">
                  Organization{inquiry.organization ? " (defaults to the inquiry's)" : ""}
                </label>
                <input
                  id={id("organization")}
                  name="organization"
                  type="text"
                  maxLength={255}
                  defaultValue={values?.organization ?? inquiry.organization ?? ""}
                  className={inputClasses}
                  {...invalidProps(id("organization-error"), errors.organization)}
                />
                <FieldMessage id={id("organization-error")} message={errors.organization} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
              <div>
                <label htmlFor={id("purpose")} className="text-xs font-medium text-zinc-700">
                  Purpose of visit (optional)
                </label>
                <input
                  id={id("purpose")}
                  name="purpose"
                  type="text"
                  maxLength={1000}
                  defaultValue={values?.purpose ?? ""}
                  placeholder="e.g. Class field trip"
                  className={inputClasses}
                  {...invalidProps(id("purpose-error"), errors.purpose)}
                />
                <FieldMessage id={id("purpose-error")} message={errors.purpose} />
              </div>
              <div>
                <label htmlFor={id("count")} className="text-xs font-medium text-zinc-700">
                  Visitors
                </label>
                <input
                  id={id("count")}
                  name="visitorCount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_VISITOR_COUNT}
                  defaultValue={values?.visitorCount ?? "1"}
                  className={inputClasses}
                  {...invalidProps(id("count-error"), errors.visitorCount)}
                />
                <FieldMessage id={id("count-error")} message={errors.visitorCount} />
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-zinc-700">
                Preferred schedules (most preferred first, up to {MAX_PREFERRED_SCHEDULES})
              </legend>
              {rowIds.map((rowId, index) => {
                const rowError = state.scheduleErrors?.[index];
                const errorId = id(`schedule-${rowId}-error`);
                const invalid = invalidProps(errorId, rowError);
                return (
                  <div key={rowId}>
                    <div className="grid grid-cols-[1fr_6.5rem_6.5rem_auto] items-end gap-2">
                      <label className="text-[11px] text-zinc-500">
                        Option {index + 1} date
                        <input
                          name="scheduleDate"
                          type="date"
                          min={today}
                          defaultValue={values?.scheduleDate[index] ?? ""}
                          className={inputClasses}
                          {...invalid}
                        />
                      </label>
                      <label className="text-[11px] text-zinc-500">
                        Start
                        <input
                          name="scheduleStart"
                          type="time"
                          defaultValue={values?.scheduleStart[index] ?? ""}
                          className={inputClasses}
                          {...invalid}
                        />
                      </label>
                      <label className="text-[11px] text-zinc-500">
                        End
                        <input
                          name="scheduleEnd"
                          type="time"
                          defaultValue={values?.scheduleEnd[index] ?? ""}
                          className={inputClasses}
                          {...invalid}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={rowIds.length === 1}
                        onClick={() => setRowIds((ids) => ids.filter((existing) => existing !== rowId))}
                        aria-label={`Remove option ${index + 1}`}
                        className="mb-0.5 rounded-lg p-2 text-zinc-500 hover:bg-sage-100 disabled:invisible"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <FieldMessage id={errorId} message={rowError} />
                  </div>
                );
              })}
              <FieldMessage id={id("schedules-error")} message={errors.schedules} />
              {rowIds.length < MAX_PREFERRED_SCHEDULES && (
                <button
                  type="button"
                  onClick={() => setRowIds((ids) => [...ids, ...nextRowIds(1)])}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:underline"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add another option
                </button>
              )}
            </fieldset>

            <div>
              <label htmlFor={id("note")} className="text-xs font-medium text-zinc-700">
                Referral note (optional)
              </label>
              <textarea
                id={id("note")}
                name="note"
                rows={2}
                maxLength={NOTE_MAX}
                defaultValue={values?.note ?? ""}
                placeholder="Recorded on both timelines"
                className={inputClasses}
                {...invalidProps(id("note-error"), errors.note)}
              />
              <FieldMessage id={id("note-error")} message={errors.note} />
            </div>

            <ActionError message={state.message} />

            <div className="flex flex-col-reverse gap-2 border-t border-black/10 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button type="submit" disabled={pending} className={`${primaryButtonClasses} sm:w-auto sm:px-4`}>
                Create visit request
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
