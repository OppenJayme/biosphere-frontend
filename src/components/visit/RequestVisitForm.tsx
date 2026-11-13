"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field, FieldError, FieldGroupLabel, fieldClasses, fieldErrorId, fieldErrorProps } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, PlusIcon, CloseIcon } from "@/components/icons";
import { FormAlert, PrivacyConsent, SubmissionSuccess, focusFirstInvalid } from "@/components/public-forms/FormParts";
import type { FieldErrors } from "@/features/public-submissions/form-fields";
import {
  MAX_PREFERRED_SCHEDULES,
  MAX_VISITOR_COUNT,
  MUSEUM_OPENING_HOURS,
  museumClock,
  museumToday,
  normalizeTime,
  keepIfOffered,
  openingWindowsFor,
  scheduleRowOptions,
  summarizeOpeningHours,
  validateSchedules,
  type ScheduleInput,
  type ScheduleRules,
} from "@/features/public-submissions/schedule";
import {
  postPublicSubmission,
  type SubmissionReceipt,
  type SubmissionResult,
} from "@/features/public-submissions/submit";
import {
  FIRST_NAME_MAX,
  LAST_NAME_MAX,
  MAX_VEHICLES,
  PLATE_NUMBER_MAX,
  VEHICLE_TEXT_MAX,
  readVisitRequestForm,
  visitorCountField,
  type VehicleField,
  type VisitFormField,
} from "@/features/visit-requests/form";
import { ScheduleDayHint } from "./ScheduleDayHint";
import { ScheduleTimeSelect } from "./ScheduleTimeSelect";
import { useVisitAvailability } from "./useVisitAvailability";

let rowIdCounter = 0;
function nextRowId() {
  rowIdCounter += 1;
  return rowIdCounter;
}

/** Schedule rows are controlled so each can show its day's hours and booked times as it is filled. */
type ScheduleRow = { id: number } & ScheduleInput;
function newScheduleRow(): ScheduleRow {
  return { id: nextRowId(), date: "", startTime: "", endTime: "" };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The hours, closed day, passed time, and booked time problems for one finished row, shown while
 * the visitor is still filling it in. Missing fields wait for Submit, so a half typed row is not
 * flagged.
 */
function liveScheduleError(row: ScheduleRow, rules: ScheduleRules) {
  const schedule = { date: row.date, startTime: normalizeTime(row.startTime), endTime: normalizeTime(row.endTime) };
  if (!DATE_PATTERN.test(schedule.date)) return undefined;
  const closed = openingWindowsFor(schedule.date, rules.openingHours ?? MUSEUM_OPENING_HOURS).length === 0;
  // A closed day is already explained by the day hint under the row.
  if (closed || !schedule.startTime || !schedule.endTime) return undefined;
  return validateSchedules([schedule], museumClock(), rules).rowErrors[0];
}

const segmentClasses =
  "cursor-pointer rounded-full px-4 py-1.5 text-ink-muted transition-colors hover:text-brand has-checked:bg-brand-solid has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-brand has-focus-visible:ring-offset-2";

export function RequestVisitForm({
  onCancel,
  onSubmitted,
}: {
  onCancel?: () => void;
  onSubmitted?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [today] = useState(museumToday);
  const { availability, status: availabilityStatus, ensureDate, reload: reloadAvailability } = useVisitAvailability(today);
  // Hours come from the availability response once it loads; the shared copy covers the moment before.
  const scheduleRules: ScheduleRules = {
    openingHours: availability?.openingHours,
    booked: availability?.booked,
  };
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(() => [newScheduleRow()]);
  const [visitorRows, setVisitorRows] = useState<number[]>(() => [nextRowId()]);
  const [visitorCount, setVisitorCount] = useState("1");
  const visitorCountCheck = visitorCountField.safeParse(visitorCount);
  const visitorLimit = visitorCountCheck.success ? visitorCountCheck.data : 0;
  const visitorCountError = visitorCountCheck.success ? undefined : visitorCountCheck.error.issues[0]?.message;
  const excessVisitorRows = visitorLimit > 0 && visitorRows.length > visitorLimit;
  const visitorRowsError = excessVisitorRows
    ? `You have ${visitorRows.length} visitor name rows but only ${visitorLimit} visitors. Remove extra rows or increase Number of Visitors. Your names have been kept.`
    : undefined;
  const [bringingVehicle, setBringingVehicle] = useState(false);
  const [vehicleRows, setVehicleRows] = useState<number[]>(() => [nextRowId()]);
  const [errors, setErrors] = useState<FieldErrors<VisitFormField>>({});
  const [scheduleErrors, setScheduleErrors] = useState<(string | undefined)[]>([]);
  const [vehicleErrors, setVehicleErrors] = useState<FieldErrors<VehicleField>[]>([]);
  const [visitorErrors, setVisitorErrors] = useState<(string | undefined)[]>([]);
  const [failure, setFailure] = useState<Extract<SubmissionResult, { ok: false }> | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(false);
  const retryBlocked = failure?.outcome === "unknown" && !retryAllowed;
  const [formKey, setFormKey] = useState(0);

  if (receipt) {
    return (
      <SubmissionSuccess
        title="Your visit request was sent"
        receipt={receipt}
        onDone={onSubmitted}
        onAnother={() => {
          setReceipt(null);
          setScheduleRows([newScheduleRow()]);
          setVisitorRows([nextRowId()]);
          setVisitorCount("1");
          setBringingVehicle(false);
          setVehicleRows([nextRowId()]);
          setFormKey((key) => key + 1);
        }}
      >
        <p>
          Thank you. A curator will review your request and email you once one of your preferred
          schedules is approved. Your visit is not confirmed until you hear from us. Campus entry is
          usually issued within 3 to 5 office days once we have all the details we need, so please
          send your request well before your preferred date.
        </p>
        <p>
          Save your reference number. If you have not heard from us and your visit date is getting
          close, check your spam or
          junk folder first, then send a General Inquiry or contact the museum. To change or cancel
          this request, send a General Inquiry with the topic &ldquo;Follow up, change, or cancel a
          visit request&rdquo; and your reference number. Please do not send a new visit request.
        </p>
        <p>
          Approved visits still go through the University of San Carlos campus-entry process, which
          the museum arranges with you.
        </p>
      </SubmissionSuccess>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || retryBlocked) return;
    if (excessVisitorRows) {
      formRef.current?.querySelector<HTMLInputElement>('[name="visitorCount"]')?.focus();
      return;
    }

    // The museum clock is read at submit time, so a form left open still catches a time that has passed.
    const parsed = readVisitRequestForm(new FormData(event.currentTarget), museumClock(), scheduleRules);
    setFailure(null);
    if (!parsed.success) {
      setErrors(parsed.errors);
      setScheduleErrors(parsed.scheduleErrors);
      setVehicleErrors(parsed.vehicleErrors);
      setVisitorErrors(parsed.visitorErrors);
      focusFirstInvalid(formRef.current);
      return;
    }

    setErrors({});
    setScheduleErrors([]);
    setVehicleErrors([]);
    setVisitorErrors([]);
    setRetryAllowed(false);
    setSubmitting(true);
    const result = await postPublicSubmission("/visit-requests", parsed.data);
    setSubmitting(false);

    if (result.ok) {
      setReceipt(result.receipt);
    } else {
      setFailure(result);
      // A rejected time may have just been booked by someone else; refresh what the rows show.
      if (result.outcome === "rejected" && /booked|overlap/i.test([result.message, ...result.details].join(" "))) {
        reloadAvailability();
      }
    }
  }

  function updateScheduleRow(rowId: number, index: number, change: Partial<ScheduleInput>) {
    setScheduleRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...change } : row)));
    // The row changed, so its message from the last submit no longer applies.
    setScheduleErrors((current) => current.map((error, position) => (position === index ? undefined : error)));
    if (change.date && DATE_PATTERN.test(change.date)) ensureDate(change.date);
  }

  return (
    <form key={formKey} ref={formRef} noValidate className="space-y-8" onSubmit={handleSubmit}>
      {/* Desktop: contact and notes (left) beside schedule, visitors and vehicle (right), so the
          form fits about one screen in the wide modal. The right column spans both rows and the
          spare height goes to row 2, so the notes sit right under the contact details. Below lg
          everything stacks in the original order. */}
      <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <FieldGroupLabel>Contact Details</FieldGroupLabel>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Person Name" htmlFor="visit-name" error={errors.name}>
                <input
                  id="visit-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  required
                  maxLength={100}
                  className={fieldClasses}
                  {...fieldErrorProps("visit-name", errors.name)}
                />
              </Field>
              <Field label="Email Address" htmlFor="visit-email" error={errors.email}>
                <input
                  id="visit-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@school.edu.ph"
                  required
                  maxLength={100}
                  className={fieldClasses}
                  {...fieldErrorProps("visit-email", errors.email)}
                />
              </Field>
              <Field label="Contact Number" htmlFor="visit-phone" error={errors.phone}>
                <input
                  id="visit-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0917 123 4567"
                  required
                  maxLength={20}
                  className={fieldClasses}
                  {...fieldErrorProps("visit-phone", errors.phone)}
                />
              </Field>
              <Field label="Organization / School" htmlFor="visit-org" error={errors.organization}>
                <input
                  id="visit-org"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  placeholder="University of San Carlos"
                  required
                  maxLength={255}
                  className={fieldClasses}
                  {...fieldErrorProps("visit-org", errors.organization)}
                />
              </Field>
            </div>

            <Field label="Address" htmlFor="visit-address" optional error={errors.address}>
              <input
                id="visit-address"
                name="address"
                type="text"
                autoComplete="street-address"
                placeholder="Street, City, Province"
                maxLength={255}
                className={fieldClasses}
                {...fieldErrorProps("visit-address", errors.address)}
              />
            </Field>

            <Field label="Purpose of Visit" htmlFor="visit-purpose" error={errors.purpose}>
              <textarea
                id="visit-purpose"
                name="purpose"
                rows={3}
                placeholder="Field trip, research, class requirement, etc."
                required
                maxLength={1000}
                className={fieldClasses}
                {...fieldErrorProps("visit-purpose", errors.purpose)}
              />
            </Field>
          </div>
        </div>

        <div className="min-w-0 space-y-8 lg:row-span-2">
          <fieldset className="min-w-0 space-y-4" aria-describedby="visit-schedule-hint">
            <legend className="contents">
              <FieldGroupLabel>Preferred Schedules</FieldGroupLabel>
            </legend>
            <div id="visit-schedule-hint" className="space-y-1 text-sm text-ink-muted">
              <p>
                List up to {MAX_PREFERRED_SCHEDULES} options, most preferred first. A curator will approve one of them.
              </p>
              <p>
                Each option must fit inside the museum&apos;s visiting hours:{" "}
                {summarizeOpeningHours(availability?.openingHours ?? MUSEUM_OPENING_HOURS)}
              </p>
            </div>

            <ol className="space-y-3">
              {scheduleRows.map((row, index) => {
                const rowId = row.id;
                const rowError = scheduleErrors[index] ?? liveScheduleError(row, scheduleRules);
                const errorId = `schedule-${rowId}-error`;
                const dayHintId = `schedule-${rowId}-day`;
                const showDayHint = DATE_PATTERN.test(row.date) && row.date >= today;
                const windows = showDayHint
                  ? openingWindowsFor(row.date, availability?.openingHours ?? MUSEUM_OPENING_HOURS)
                  : [];
                const describedBy = [rowError && errorId, showDayHint && !(windows.length === 0 && rowError) && dayHintId].filter(Boolean).join(" ");
                const invalid = {
                  ...(rowError && { "aria-invalid": true as const }),
                  ...(describedBy && { "aria-describedby": describedBy }),
                };
                // Every weekly time before a date is chosen; that day's bookable times after.
                const options = scheduleRowOptions(row, today, scheduleRules);
                return (
                  <li key={rowId} className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-ink">Option {index + 1}</p>
                      {scheduleRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setScheduleRows((rows) => rows.filter((item) => item.id !== rowId));
                            setScheduleErrors([]);
                          }}
                          aria-label={`Remove option ${index + 1}`}
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-soft hover:text-brand"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                      <Field label="Date" htmlFor={`schedule-date-${rowId}`}>
                        <input
                          id={`schedule-date-${rowId}`}
                          name="scheduleDate"
                          type="date"
                          min={today}
                          required
                          value={row.date}
                          // Keep picked times the new date still offers; clear the rest.
                          onChange={(event) => {
                            const date = event.target.value;
                            const startTime = keepIfOffered(row.startTime, scheduleRowOptions({ date, startTime: "" }, today, scheduleRules).start);
                            const endTime = keepIfOffered(row.endTime, scheduleRowOptions({ date, startTime }, today, scheduleRules).end);
                            updateScheduleRow(rowId, index, { date, startTime, endTime });
                          }}
                          className={fieldClasses}
                          {...invalid}
                        />
                      </Field>
                      <Field label="Start Time" htmlFor={`schedule-start-${rowId}`}>
                        <ScheduleTimeSelect
                          id={`schedule-start-${rowId}`}
                          name="scheduleStart"
                          required
                          options={options.start}
                          value={row.startTime}
                          onChange={(event) => {
                            const startTime = event.target.value;
                            const end = scheduleRowOptions({ date: row.date, startTime }, today, scheduleRules).end;
                            updateScheduleRow(rowId, index, { startTime, endTime: keepIfOffered(row.endTime, end) });
                          }}
                          className={fieldClasses}
                          {...invalid}
                        />
                      </Field>
                      <Field label="End Time" htmlFor={`schedule-end-${rowId}`}>
                        <ScheduleTimeSelect
                          id={`schedule-end-${rowId}`}
                          name="scheduleEnd"
                          required
                          options={options.end}
                          value={row.endTime}
                          onChange={(event) => updateScheduleRow(rowId, index, { endTime: event.target.value })}
                          className={fieldClasses}
                          {...invalid}
                        />
                      </Field>
                    </div>
                    {rowError && <FieldError id={errorId}>{rowError}</FieldError>}
                    {showDayHint && !(windows.length === 0 && rowError) && (
                      <ScheduleDayHint
                        id={dayHintId}
                        date={row.date}
                        availability={availability}
                        status={availabilityStatus}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            {errors.schedules && <FieldError id="visit-schedules-error">{errors.schedules}</FieldError>}

            {scheduleRows.length < MAX_PREFERRED_SCHEDULES && (
              <button
                type="button"
                onClick={() => setScheduleRows((rows) => rows.length < MAX_PREFERRED_SCHEDULES ? [...rows, newScheduleRow()] : rows)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
              >
                <PlusIcon className="h-4 w-4" />
                Add another option
              </button>
            )}
            {scheduleRows.length === MAX_PREFERRED_SCHEDULES && (
              <p role="status" className="text-sm text-ink-muted">Maximum of {MAX_PREFERRED_SCHEDULES} preferred schedules reached. Remove an option to add another.</p>
            )}
          </fieldset>

          <div className="space-y-4">
            <FieldGroupLabel>Visitors</FieldGroupLabel>
            <div className="sm:max-w-[16rem]">
              <Field label="Number of Visitors" htmlFor="visit-count" error={visitorCountError ?? errors.visitorCount}>
                <input
                  id="visit-count"
                  name="visitorCount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_VISITOR_COUNT}
                  step={1}
                  value={visitorCount}
                  onChange={(event) => {
                    setVisitorCount(event.target.value);
                    setErrors((current) => ({ ...current, visitorCount: undefined, visitors: undefined }));
                  }}
                  required
                  className={fieldClasses}
                  {...fieldErrorProps("visit-count", visitorCountError ?? errors.visitorCount)}
                />
              </Field>
            </div>
            <p className="text-sm text-ink-muted">Enter the total number attending, including accompanying adults. Up to {MAX_VISITOR_COUNT} visitors per request.</p>
            {visitorCountError && <p role="alert" className="sr-only">{visitorCountError}</p>}
            {visitorLimit === MAX_VISITOR_COUNT && (
              <p role="status" className="text-sm text-ink-muted">Maximum request size reached ({MAX_VISITOR_COUNT} visitors).</p>
            )}

            <fieldset className="min-w-0 space-y-3" aria-describedby="visit-name-limit">
              <legend className="text-xs font-medium text-ink-muted">Visitor names</legend>
              <p className="text-sm text-ink-muted">
                Enter the first and last name of every visitor. The university needs the full list for campus entry.
              </p>
              {visitorRows.map((rowId, index) => {
                const rowError = visitorErrors[index];
                const errorId = `visitor-${rowId}-error`;
                // Mark only the incomplete rows; when every row is complete but there are too few,
                // the list message applies to all of them.
                const listError = errors.visitors && !visitorErrors.some(Boolean);
                const describedBy = [rowError && errorId, (rowError || listError) && errors.visitors && fieldErrorId("visit-visitors")]
                  .filter(Boolean)
                  .join(" ");
                const invalid = {
                  ...((rowError || listError) && { "aria-invalid": true as const }),
                  ...(describedBy && { "aria-describedby": describedBy }),
                };
                return (
                  <div key={rowId}>
                    <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                      <Field label="First Name" htmlFor={`visitor-first-${rowId}`}>
                        <input
                          id={`visitor-first-${rowId}`}
                          name="visitorFirstName"
                          type="text"
                          autoComplete="off"
                          placeholder="Juan"
                          required
                          maxLength={FIRST_NAME_MAX}
                          aria-label={`Visitor ${index + 1} first name`}
                          className={fieldClasses}
                          {...invalid}
                        />
                      </Field>
                      <Field label="Last Name" htmlFor={`visitor-last-${rowId}`}>
                        <input
                          id={`visitor-last-${rowId}`}
                          name="visitorLastName"
                          type="text"
                          autoComplete="off"
                          placeholder="Dela Cruz"
                          required
                          maxLength={LAST_NAME_MAX}
                          aria-label={`Visitor ${index + 1} last name`}
                          className={fieldClasses}
                          {...invalid}
                        />
                      </Field>
                      <button
                        type="button"
                        disabled={visitorRows.length === 1}
                        onClick={() => {
                          setVisitorRows((rows) => rows.filter((id) => id !== rowId));
                          setVisitorErrors([]);
                          setErrors((current) => ({ ...current, visitors: undefined }));
                        }}
                        aria-label={`Remove visitor ${index + 1}`}
                        className="rounded-lg p-2.5 text-ink-muted hover:bg-brand-soft hover:text-brand disabled:invisible"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {rowError && <FieldError id={errorId}>{rowError}</FieldError>}
                  </div>
                );
              })}
              {errors.visitors && <FieldError id={fieldErrorId("visit-visitors")}>{errors.visitors}</FieldError>}
            </fieldset>

            <p id="visit-name-limit" role={excessVisitorRows ? "alert" : "status"} className={excessVisitorRows ? "text-sm font-medium text-red-700" : "text-sm text-ink-muted"}>
              {visitorRowsError ?? (visitorLimit === 0
                ? "Enter a valid Number of Visitors before adding names."
                : visitorRows.length === visitorLimit
                  ? `Visitor name limit reached (${visitorLimit}): one name for each visitor. Increase Number of Visitors to add another.`
                  : `${visitorRows.length} of ${visitorLimit} visitor names. Add a name for each visitor.`)}
            </p>
            <button
              type="button"
              disabled={visitorLimit === 0 || visitorRows.length >= visitorLimit}
              aria-describedby="visit-name-limit"
              onClick={() => setVisitorRows((rows) => rows.length < visitorLimit ? [...rows, nextRowId()] : rows)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
            >
              <PlusIcon className="h-4 w-4" />
              Add a visitor name
            </button>
          </div>

          <fieldset className="min-w-0 space-y-4">
            <legend className="contents">
              <FieldGroupLabel>Vehicle</FieldGroupLabel>
            </legend>
            <div className="inline-flex rounded-full border border-line p-1 text-sm font-medium">
              <label className={segmentClasses}>
                <input
                  type="radio"
                  name="bringingVehicle"
                  value="true"
                  checked={bringingVehicle}
                  onChange={() => setBringingVehicle(true)}
                  className="sr-only"
                />
                Yes, bringing a vehicle
              </label>
              <label className={segmentClasses}>
                <input
                  type="radio"
                  name="bringingVehicle"
                  value="false"
                  checked={!bringingVehicle}
                  onChange={() => setBringingVehicle(false)}
                  className="sr-only"
                />
                No vehicle
              </label>
            </div>

            {bringingVehicle && (
              <>
                <p className="text-sm text-ink-muted">List each vehicle coming to campus, up to {MAX_VEHICLES}.</p>
                <ol className="space-y-3">
                  {vehicleRows.map((rowId, index) => {
                    const rowErrors = vehicleErrors[index];
                    return (
                      <li key={rowId} className="rounded-xl border border-line p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-ink">Vehicle {index + 1}</p>
                          {vehicleRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setVehicleRows((rows) => rows.filter((id) => id !== rowId));
                                setVehicleErrors([]);
                              }}
                              aria-label={`Remove vehicle ${index + 1}`}
                              className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-soft hover:text-brand"
                            >
                              <CloseIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2 grid gap-4 sm:grid-cols-3">
                          <Field label="Plate Number" htmlFor={`visit-plate-${rowId}`} error={rowErrors?.plateNumber}>
                            <input
                              id={`visit-plate-${rowId}`}
                              name="plateNumber"
                              type="text"
                              placeholder="ABC 1234"
                              required
                              maxLength={PLATE_NUMBER_MAX}
                              className={fieldClasses}
                              {...fieldErrorProps(`visit-plate-${rowId}`, rowErrors?.plateNumber)}
                            />
                          </Field>
                          <Field label="Car Brand" htmlFor={`visit-car-brand-${rowId}`} optional error={rowErrors?.carBrand}>
                            <input
                              id={`visit-car-brand-${rowId}`}
                              name="carBrand"
                              type="text"
                              placeholder="Toyota"
                              maxLength={VEHICLE_TEXT_MAX}
                              className={fieldClasses}
                              {...fieldErrorProps(`visit-car-brand-${rowId}`, rowErrors?.carBrand)}
                            />
                          </Field>
                          <Field label="Car Type" htmlFor={`visit-car-type-${rowId}`} optional error={rowErrors?.carType}>
                            <input
                              id={`visit-car-type-${rowId}`}
                              name="carType"
                              type="text"
                              placeholder="Van, Sedan, School Bus"
                              maxLength={VEHICLE_TEXT_MAX}
                              className={fieldClasses}
                              {...fieldErrorProps(`visit-car-type-${rowId}`, rowErrors?.carType)}
                            />
                          </Field>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {vehicleRows.length < MAX_VEHICLES && (
                  <button
                    type="button"
                    onClick={() => setVehicleRows((rows) => rows.length < MAX_VEHICLES ? [...rows, nextRowId()] : rows)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add another vehicle
                  </button>
                )}
                {vehicleRows.length === MAX_VEHICLES && (
                  <p role="status" className="text-sm text-ink-muted">Maximum of {MAX_VEHICLES} vehicles reached. Remove a vehicle to add another.</p>
                )}
              </>
            )}
          </fieldset>
        </div>

        <div>
          <div className="space-y-4">
            <FieldGroupLabel>Additional Info</FieldGroupLabel>
            <Field label="Equipment to Bring" htmlFor="visit-equipment" optional error={errors.equipment}>
              <input
                id="visit-equipment"
                name="equipment"
                type="text"
                placeholder="Cameras, notebooks, recording gear"
                maxLength={500}
                className={fieldClasses}
                {...fieldErrorProps("visit-equipment", errors.equipment)}
              />
            </Field>
            <Field label="Additional Notes" htmlFor="visit-notes" optional error={errors.notes}>
              <textarea
                id="visit-notes"
                name="notes"
                rows={3}
                placeholder="Anything else we should know"
                maxLength={1000}
                className={fieldClasses}
                {...fieldErrorProps("visit-notes", errors.notes)}
              />
            </Field>
          </div>
        </div>
      </div>

      {failure && (
        <FormAlert
          message={failure.message}
          details={failure.details}
          uncertain={failure.outcome === "unknown"}
          onAllowRetry={retryBlocked ? () => setRetryAllowed(true) : undefined}
        />
      )}

      {/* Desktop: consent beside the buttons to save a row; phones keep them stacked. */}
      <div className="space-y-6 border-t border-line pt-6 lg:flex lg:items-center lg:gap-8 lg:space-y-0">
        <div className="lg:flex-1">
          <PrivacyConsent id="visit-consent" purpose="this visit request" error={errors.consent} />
        </div>
        <div className="flex shrink-0 justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline-forest" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="solid-forest" disabled={submitting || retryBlocked || excessVisitorRows} aria-busy={submitting || undefined}>
            {submitting ? "Sending…" : "Submit Request"}
            {!submitting && <ArrowRightIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
