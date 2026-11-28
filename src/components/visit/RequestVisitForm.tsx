"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FieldError, fieldErrorId, fieldErrorProps } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ChevronLeftIcon, PlusIcon, CloseIcon } from "@/components/icons";
import { FormAlert, PrivacyConsent, SubmissionSuccess, focusFirstInvalid } from "@/components/public-forms/FormParts";
import { FormSteps } from "@/components/public-forms/FormSteps";
import { InfoTip } from "@/components/public-forms/InfoTip";
import {
  FormHint,
  PublicField,
  publicFieldClasses,
  publicInputClasses,
  publicRowInputClasses,
} from "@/components/public-forms/PublicField";
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
import {
  LAST_VISIT_STEP,
  VISITORS_STEP,
  VISIT_FORM_STEPS,
  errorsForStep,
  firstStepWithErrors,
  stepHasErrors,
  type VisitFormFailure,
} from "@/features/visit-requests/form-steps";
import type { VisitorName } from "@/features/visit-requests/names-file";
import { ScheduleDayHint, scheduleDayHintShown } from "./ScheduleDayHint";
import { VisitorNamesFile } from "./VisitorNamesFile";
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

/** Beyond this many visitors the name list scrolls inside its own box instead of stretching the form. */
const NAME_LIST_SCROLL_AFTER = 6;
/** Vehicle rows are taller on phones (two lines), so their list starts scrolling sooner. */
const VEHICLE_LIST_SCROLL_AFTER = 4;

/** #, plate, then brand and type (a second line on phones), then remove. */
const vehicleGridClasses =
  "grid-cols-[1.5rem_minmax(0,1fr)_2.25rem] sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,2fr)_2.25rem]";

/**
 * The hours, closed day, passed time, and booked time problems for one finished row, shown while
 * the visitor is still filling it in. Missing fields wait for Next or Submit, so a half typed row
 * is not flagged.
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

const rowCardClasses = "rounded-xl border border-forest-900/10 bg-surface p-4 shadow-[0_1px_2px_rgb(20_42_31/0.04)]";

/** A step's title, focused when the step opens, with its guidance behind an (i) beside it. */
function StepHeading({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <h3 id={`visit-step-${step}`} tabIndex={-1} className="font-display text-xl font-semibold tracking-tight text-ink outline-none">
        {title}
      </h3>
      <InfoTip label={`About ${title}`}>{children}</InfoTip>
    </div>
  );
}

const linkButtonClasses =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline";

/**
 * The public visit request, asked in four short steps (panel feedback: the single long form was
 * too much at once). All steps live in one <form> and stay mounted while hidden, so typed values
 * survive Back and Next and the final submit sends everything. Next checks only the step on screen.
 */
export function RequestVisitForm({
  onCancel,
  onSubmitted,
}: {
  onCancel?: () => void;
  onSubmitted?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  // Set when the visitor moves between steps, so focus follows; not on first open.
  const stepMoved = useRef(false);
  const [today] = useState(museumToday);
  const { availability, status: availabilityStatus, ensureDate, reload: reloadAvailability } = useVisitAvailability(today);
  // Hours come from the availability response once it loads; the shared copy covers the moment before.
  const scheduleRules: ScheduleRules = {
    openingHours: availability?.openingHours,
    booked: availability?.booked,
  };
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>(() => [newScheduleRow()]);
  const [visitorRows, setVisitorRows] = useState<number[]>(() => [nextRowId()]);
  // Starting values for rows added from a names file; typed rows have none.
  const [visitorDefaults, setVisitorDefaults] = useState<Record<number, VisitorName>>({});
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
  const lastStep = step === LAST_VISIT_STEP;

  // Bring the new step's heading to the top and read it out, so a long step never opens mid-way.
  useEffect(() => {
    if (!stepMoved.current) return;
    stepMoved.current = false;
    formRef.current?.scrollIntoView({ block: "start" });
    formRef.current?.querySelector<HTMLElement>(`#visit-step-${step}`)?.focus({ preventScroll: true });
  }, [step]);

  if (receipt) {
    return (
      <SubmissionSuccess
        title="Your visit request was sent"
        receipt={receipt}
        onDone={onSubmitted}
        onAnother={() => {
          setReceipt(null);
          setStep(0);
          setScheduleRows([newScheduleRow()]);
          setVisitorRows([nextRowId()]);
          setVisitorDefaults({});
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

  function showErrors(shown: VisitFormFailure) {
    setErrors(shown.errors);
    setScheduleErrors(shown.scheduleErrors);
    setVehicleErrors(shown.vehicleErrors);
    setVisitorErrors(shown.visitorErrors);
  }

  function clearErrors() {
    showErrors({ errors: {}, scheduleErrors: [], vehicleErrors: [], visitorErrors: [] });
  }

  function goToStep(next: number) {
    stepMoved.current = true;
    setStep(next);
  }

  /** Checks the step on screen; later steps' problems (like the unticked consent) wait their turn. */
  function goNext(form: HTMLFormElement) {
    if (step === VISITORS_STEP && excessVisitorRows) {
      form.querySelector<HTMLInputElement>('[name="visitorCount"]')?.focus();
      return;
    }
    const parsed = readVisitRequestForm(new FormData(form), museumClock(), scheduleRules);
    if (!parsed.success && stepHasErrors(step, parsed)) {
      showErrors(errorsForStep(step, parsed));
      focusFirstInvalid(form);
      return;
    }
    clearErrors();
    goToStep(step + 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Enter in a field, or the Next button, moves on a step until the last one.
    if (!lastStep) {
      goNext(event.currentTarget);
      return;
    }
    if (submitting || retryBlocked) return;
    if (excessVisitorRows) {
      goToStep(VISITORS_STEP);
      return;
    }

    // The museum clock is read at submit time, so a form left open still catches a time that has passed.
    const parsed = readVisitRequestForm(new FormData(event.currentTarget), museumClock(), scheduleRules);
    setFailure(null);
    if (!parsed.success) {
      // Every problem is marked, and the form returns to the earliest step that has one.
      showErrors(parsed);
      const target = firstStepWithErrors(parsed);
      if (target !== step) goToStep(target);
      focusFirstInvalid(formRef.current);
      return;
    }

    clearErrors();
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

  /**
   * Adds the names from a file as rows after any the visitor already filled in, dropping blank
   * rows, and raises Number of Visitors to match when the list is longer. Returns the message
   * shown under the file button.
   */
  function addNamesFromFile(names: VisitorName[], { fileName, skipped }: { fileName: string; skipped: number }) {
    const typedRows = visitorRows.filter((rowId) => {
      const first = formRef.current?.querySelector<HTMLInputElement>(`#visitor-first-${rowId}`)?.value.trim();
      const last = formRef.current?.querySelector<HTMLInputElement>(`#visitor-last-${rowId}`)?.value.trim();
      return Boolean(first || last);
    });
    const room = MAX_VISITOR_COUNT - typedRows.length;
    if (room <= 0) {
      return `No names were added: the list already has ${MAX_VISITOR_COUNT} visitors, the most a request can hold.`;
    }
    const added = names.slice(0, room).map((name) => ({ id: nextRowId(), name }));
    setVisitorDefaults((current) => ({ ...current, ...Object.fromEntries(added.map(({ id, name }) => [id, name])) }));
    setVisitorRows([...typedRows, ...added.map(({ id }) => id)]);
    setVisitorErrors([]);
    setErrors((current) => ({ ...current, visitors: undefined, visitorCount: undefined }));

    const total = typedRows.length + added.length;
    const raised = !visitorCountCheck.success || total > visitorLimit;
    if (raised) setVisitorCount(String(total));

    const needLastName = added.filter(({ name }) => !name.lastName).length;
    return [
      `Added ${added.length} name${added.length === 1 ? "" : "s"} from ${fileName}. Check each one before you send.`,
      names.length > added.length &&
        `Only the first ${added.length} were added: a request can have up to ${MAX_VISITOR_COUNT} visitors.`,
      raised && `Number of Visitors is now ${total}.`,
      needLastName > 0 && `${needLastName} need${needLastName === 1 ? "s" : ""} a last name.`,
      skipped > 0 && `${skipped} line${skipped === 1 ? " was" : "s were"} not a name and ${skipped === 1 ? "was" : "were"} skipped.`,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function updateScheduleRow(rowId: number, index: number, change: Partial<ScheduleInput>) {
    setScheduleRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, ...change } : row)));
    // The row changed, so its message from the last check no longer applies.
    setScheduleErrors((current) => current.map((error, position) => (position === index ? undefined : error)));
    if (change.date && DATE_PATTERN.test(change.date)) ensureDate(change.date);
  }

  return (
    <form key={formKey} ref={formRef} noValidate className="scroll-mt-10 space-y-6" onSubmit={handleSubmit}>
      <FormSteps steps={VISIT_FORM_STEPS} current={step} onBack={goToStep} />

      {/* Step 1: who is asking. */}
      <section hidden={step !== 0} aria-labelledby="visit-step-0" className="space-y-5">
        <StepHeading step={0} title="Your details">
          Who the museum should contact about this visit. A curator replies to this email address.
        </StepHeading>

        <div className="grid gap-4 sm:grid-cols-2">
          <PublicField label="Contact Person Name" htmlFor="visit-name" error={errors.name}>
            <input
              id="visit-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              required
              maxLength={100}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-name", errors.name)}
            />
          </PublicField>
          <PublicField label="Email Address" htmlFor="visit-email" error={errors.email}>
            <input
              id="visit-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@school.edu.ph"
              required
              maxLength={100}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-email", errors.email)}
            />
          </PublicField>
          <PublicField label="Contact Number" htmlFor="visit-phone" error={errors.phone}>
            <input
              id="visit-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0917 123 4567"
              required
              maxLength={20}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-phone", errors.phone)}
            />
          </PublicField>
          <PublicField label="Organization / School" htmlFor="visit-org" error={errors.organization}>
            <input
              id="visit-org"
              name="organization"
              type="text"
              autoComplete="organization"
              placeholder="University of San Carlos"
              required
              maxLength={255}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-org", errors.organization)}
            />
          </PublicField>
        </div>

        <PublicField label="Address" htmlFor="visit-address" optional error={errors.address}>
          <input
            id="visit-address"
            name="address"
            type="text"
            autoComplete="street-address"
            placeholder="Street, City, Province"
            maxLength={255}
            className={publicFieldClasses}
            {...fieldErrorProps("visit-address", errors.address)}
          />
        </PublicField>

        <PublicField label="Purpose of Visit" htmlFor="visit-purpose" error={errors.purpose}>
          <textarea
            id="visit-purpose"
            name="purpose"
            rows={3}
            placeholder="Field trip, research, class requirement, etc."
            required
            maxLength={1000}
            className={publicFieldClasses}
            {...fieldErrorProps("visit-purpose", errors.purpose)}
          />
        </PublicField>
      </section>

      {/* Step 2: when. */}
      <section hidden={step !== 1} aria-labelledby="visit-step-1" className="space-y-5">
        <StepHeading step={1} title="Preferred dates">
          Give up to {MAX_PREFERRED_SCHEDULES} options, most preferred first. A curator will approve one of them.
        </StepHeading>

        <fieldset className="min-w-0 space-y-4" aria-describedby="visit-schedule-hint">
          <legend className="sr-only">Preferred schedules</legend>
          <FormHint id="visit-schedule-hint">
            <p>
              <span className="font-medium">Visiting hours:</span>{" "}
              {summarizeOpeningHours(availability?.openingHours ?? MUSEUM_OPENING_HOURS)}
            </p>
            {availabilityStatus === "error" && (
              <p className="text-ink-muted">
                Booked times could not be checked just now. You can still send your request; the museum will confirm
                the time with you.
              </p>
            )}
          </FormHint>

          <ol className="space-y-3">
            {scheduleRows.map((row, index) => {
              const rowId = row.id;
              const rowError = scheduleErrors[index] ?? liveScheduleError(row, scheduleRules);
              const errorId = `schedule-${rowId}-error`;
              const dayHintId = `schedule-${rowId}-day`;
              const dateChosen = DATE_PATTERN.test(row.date) && row.date >= today;
              const closedDay =
                dateChosen && openingWindowsFor(row.date, availability?.openingHours ?? MUSEUM_OPENING_HOURS).length === 0;
              // Only a closed day or that day's booked times; a closed day already shown as an error is not repeated.
              const showDayHint = dateChosen && scheduleDayHintShown(row.date, availability) && !(closedDay && rowError);
              const describedBy = [rowError && errorId, showDayHint && dayHintId].filter(Boolean).join(" ");
              const invalid = {
                ...(rowError && { "aria-invalid": true as const }),
                ...(describedBy && { "aria-describedby": describedBy }),
              };
              // Every weekly time before a date is chosen; that day's bookable times after.
              const options = scheduleRowOptions(row, today, scheduleRules);
              return (
                <li key={rowId} className={rowCardClasses}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">
                      Option {index + 1}
                      {index === 0 && <span className="ml-1.5 font-normal text-ink-muted">(most preferred)</span>}
                    </p>
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
                    <PublicField label="Date" htmlFor={`schedule-date-${rowId}`}>
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
                        className={publicFieldClasses}
                        {...invalid}
                      />
                    </PublicField>
                    <PublicField label="Start Time" htmlFor={`schedule-start-${rowId}`}>
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
                        className={publicFieldClasses}
                        {...invalid}
                      />
                    </PublicField>
                    <PublicField label="End Time" htmlFor={`schedule-end-${rowId}`}>
                      <ScheduleTimeSelect
                        id={`schedule-end-${rowId}`}
                        name="scheduleEnd"
                        required
                        options={options.end}
                        value={row.endTime}
                        onChange={(event) => updateScheduleRow(rowId, index, { endTime: event.target.value })}
                        className={publicFieldClasses}
                        {...invalid}
                      />
                    </PublicField>
                  </div>
                  {rowError && <FieldError id={errorId}>{rowError}</FieldError>}
                  {showDayHint && <ScheduleDayHint id={dayHintId} date={row.date} availability={availability} />}
                </li>
              );
            })}
          </ol>
          {errors.schedules && <FieldError id="visit-schedules-error">{errors.schedules}</FieldError>}

          {scheduleRows.length < MAX_PREFERRED_SCHEDULES && (
            <button
              type="button"
              onClick={() => setScheduleRows((rows) => rows.length < MAX_PREFERRED_SCHEDULES ? [...rows, newScheduleRow()] : rows)}
              className={linkButtonClasses}
            >
              <PlusIcon className="h-4 w-4" />
              Add another option
            </button>
          )}
          {scheduleRows.length === MAX_PREFERRED_SCHEDULES && (
            <p role="status" className="text-sm text-ink-muted">Maximum of {MAX_PREFERRED_SCHEDULES} preferred schedules reached. Remove an option to add another.</p>
          )}
        </fieldset>
      </section>

      {/* Step 3: who is coming, and how. */}
      <section hidden={step !== VISITORS_STEP} aria-labelledby="visit-step-2" className="space-y-6">
        <StepHeading step={VISITORS_STEP} title="Visitors">
          The university needs the full name of every visitor for campus entry. To upload a list, use one name
          per line in a .txt, .docx or .pdf. The file stays on your device.
        </StepHeading>

        <div className="space-y-2">
          {/* Label and a short number box on one line: the count is a single small number. */}
          <div className="flex items-center gap-3">
            <label htmlFor="visit-count" className="text-sm font-medium text-ink">
              Number of Visitors
            </label>
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
              className={`${publicInputClasses} w-28 py-2.5`}
              {...fieldErrorProps("visit-count", visitorCountError ?? errors.visitorCount)}
            />
          </div>
          {(visitorCountError ?? errors.visitorCount) && (
            <FieldError id={fieldErrorId("visit-count")}>{visitorCountError ?? errors.visitorCount}</FieldError>
          )}
          <p className="text-sm text-ink-muted">
            Everyone attending, including accompanying adults. Up to {MAX_VISITOR_COUNT} per request.
          </p>
          {visitorCountError && <p role="alert" className="sr-only">{visitorCountError}</p>}
          {visitorLimit === MAX_VISITOR_COUNT && (
            <p role="status" className="text-sm text-ink-muted">Maximum request size reached ({MAX_VISITOR_COUNT} visitors).</p>
          )}
        </div>

        <fieldset className="min-w-0 space-y-3" aria-describedby="visit-name-limit">
          <legend className="text-sm font-medium text-ink">Visitor names</legend>
          <VisitorNamesFile onNames={addNamesFromFile} />

          {/* One header for the whole list instead of a label on every row keeps a long list short;
              each input still has its own accessible name. Long lists scroll inside this box. */}
          <div
            className={`rounded-xl border border-forest-900/10 bg-surface ${
              visitorRows.length > NAME_LIST_SCROLL_AFTER ? "max-h-80 overflow-y-auto overscroll-contain" : ""
            }`}
          >
            <div
              aria-hidden="true"
              className="sticky top-0 z-10 grid grid-cols-[2rem_1fr_1fr_2.25rem] gap-2 border-b border-forest-900/10 bg-sage-50 px-3 py-2 text-xs font-semibold text-ink-muted"
            >
              <span>#</span>
              <span>First name</span>
              <span>Last name</span>
              <span />
            </div>
            <ol className="divide-y divide-forest-900/5">
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
                  <li key={rowId} className="px-3 py-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2.25rem] items-center gap-2">
                      <span aria-hidden="true" className="text-xs tabular-nums text-ink-muted">{index + 1}</span>
                      <input
                        id={`visitor-first-${rowId}`}
                        name="visitorFirstName"
                        type="text"
                        autoComplete="off"
                        placeholder="Juan"
                        defaultValue={visitorDefaults[rowId]?.firstName}
                        required
                        maxLength={FIRST_NAME_MAX}
                        aria-label={`Visitor ${index + 1} first name`}
                        className={publicRowInputClasses}
                        {...invalid}
                      />
                      <input
                        id={`visitor-last-${rowId}`}
                        name="visitorLastName"
                        type="text"
                        autoComplete="off"
                        placeholder="Dela Cruz"
                        defaultValue={visitorDefaults[rowId]?.lastName}
                        required
                        maxLength={LAST_NAME_MAX}
                        aria-label={`Visitor ${index + 1} last name`}
                        className={publicRowInputClasses}
                        {...invalid}
                      />
                      <button
                        type="button"
                        disabled={visitorRows.length === 1}
                        onClick={() => {
                          setVisitorRows((rows) => rows.filter((id) => id !== rowId));
                          setVisitorErrors([]);
                          setErrors((current) => ({ ...current, visitors: undefined }));
                        }}
                        aria-label={`Remove visitor ${index + 1}`}
                        className="rounded-lg p-2 text-ink-muted hover:bg-brand-soft hover:text-brand disabled:invisible"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    </div>
                    {rowError && <FieldError id={errorId}>{rowError}</FieldError>}
                  </li>
                );
              })}
            </ol>
          </div>
          {errors.visitors && <FieldError id={fieldErrorId("visit-visitors")}>{errors.visitors}</FieldError>}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <button
              type="button"
              disabled={visitorLimit === 0 || visitorRows.length >= visitorLimit}
              aria-describedby="visit-name-limit"
              onClick={() => setVisitorRows((rows) => rows.length < visitorLimit ? [...rows, nextRowId()] : rows)}
              className={linkButtonClasses}
            >
              <PlusIcon className="h-4 w-4" />
              Add a visitor name
            </button>
            <p
              id="visit-name-limit"
              role={excessVisitorRows ? "alert" : "status"}
              className={excessVisitorRows ? "text-sm font-medium text-red-700" : "text-sm text-ink-muted"}
            >
              {visitorRowsError ?? (visitorLimit === 0
                ? "Enter a valid Number of Visitors before adding names."
                : `${visitorRows.length} of ${visitorLimit} name${visitorLimit === 1 ? "" : "s"}${
                    visitorRows.length === visitorLimit ? ". Raise Number of Visitors to add more." : ""
                  }`)}
            </p>
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-3">
          <legend className="text-sm font-medium text-ink">Are you bringing a vehicle to campus?</legend>
          <div className="inline-flex rounded-full border border-forest-900/15 bg-sage-50 p-1 text-sm font-medium">
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
          </div>

          {bringingVehicle && (
            <>
              <p className="text-sm text-ink-muted">List each vehicle coming to campus, up to {MAX_VEHICLES}.</p>
              {/* Same compact list as the names: one header on wider screens, numbered rows, and a box
                  that scrolls once the list is long. Phones put brand and type on a second line. */}
              <div
                className={`rounded-xl border border-forest-900/10 bg-surface ${
                  vehicleRows.length > VEHICLE_LIST_SCROLL_AFTER ? "max-h-80 overflow-y-auto overscroll-contain" : ""
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`sticky top-0 z-10 hidden gap-2 border-b border-forest-900/10 bg-sage-50 px-3 py-2 text-xs font-semibold text-ink-muted sm:grid ${vehicleGridClasses}`}
                >
                  <span>#</span>
                  <span>Plate number</span>
                  <span className="grid grid-cols-2 gap-2">
                    <span>
                      Car brand <span className="font-normal">(optional)</span>
                    </span>
                    <span>
                      Car type <span className="font-normal">(optional)</span>
                    </span>
                  </span>
                  <span />
                </div>
                <ol className="divide-y divide-forest-900/5">
                  {vehicleRows.map((rowId, index) => {
                    const rowErrors = vehicleErrors[index];
                    const fields = [
                      { name: "plateNumber", id: `visit-plate-${rowId}`, error: rowErrors?.plateNumber },
                      { name: "carBrand", id: `visit-car-brand-${rowId}`, error: rowErrors?.carBrand },
                      { name: "carType", id: `visit-car-type-${rowId}`, error: rowErrors?.carType },
                    ] as const;
                    return (
                      <li key={rowId} className="px-3 py-2">
                        <div className={`grid items-center gap-2 ${vehicleGridClasses}`}>
                          <span aria-hidden="true" className="text-xs tabular-nums text-ink-muted">{index + 1}</span>
                          <input
                            id={fields[0].id}
                            name="plateNumber"
                            type="text"
                            placeholder="Plate, e.g. ABC 1234"
                            required
                            maxLength={PLATE_NUMBER_MAX}
                            aria-label={`Vehicle ${index + 1} plate number`}
                            className={publicRowInputClasses}
                            {...fieldErrorProps(fields[0].id, fields[0].error)}
                          />
                          <div className="col-start-2 row-start-2 grid grid-cols-2 gap-2 sm:col-start-3 sm:row-start-1">
                            <input
                              id={fields[1].id}
                              name="carBrand"
                              type="text"
                              placeholder="Brand, e.g. Toyota"
                              maxLength={VEHICLE_TEXT_MAX}
                              aria-label={`Vehicle ${index + 1} car brand (optional)`}
                              className={publicRowInputClasses}
                              {...fieldErrorProps(fields[1].id, fields[1].error)}
                            />
                            <input
                              id={fields[2].id}
                              name="carType"
                              type="text"
                              placeholder="Type, e.g. Van"
                              maxLength={VEHICLE_TEXT_MAX}
                              aria-label={`Vehicle ${index + 1} car type (optional)`}
                              className={publicRowInputClasses}
                              {...fieldErrorProps(fields[2].id, fields[2].error)}
                            />
                          </div>
                          <button
                            type="button"
                            disabled={vehicleRows.length === 1}
                            onClick={() => {
                              setVehicleRows((rows) => rows.filter((id) => id !== rowId));
                              setVehicleErrors([]);
                            }}
                            aria-label={`Remove vehicle ${index + 1}`}
                            className="col-start-3 row-start-1 rounded-lg p-2 text-ink-muted hover:bg-brand-soft hover:text-brand disabled:invisible sm:col-start-4"
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {fields.map((field) =>
                          field.error ? (
                            <FieldError key={field.name} id={fieldErrorId(field.id)}>
                              {field.error}
                            </FieldError>
                          ) : null,
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>

              {vehicleRows.length < MAX_VEHICLES && (
                <button
                  type="button"
                  onClick={() => setVehicleRows((rows) => rows.length < MAX_VEHICLES ? [...rows, nextRowId()] : rows)}
                  className={linkButtonClasses}
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
      </section>

      {/* Step 4: anything else, then consent and send. */}
      <section hidden={step !== LAST_VISIT_STEP} aria-labelledby="visit-step-3" className="space-y-5">
        <StepHeading step={LAST_VISIT_STEP} title="Final details">
          Both fields are optional. Add anything that helps us prepare, then agree to the privacy notice and send.
        </StepHeading>
        <div className="space-y-4">
          <PublicField label="Equipment to Bring" htmlFor="visit-equipment" optional error={errors.equipment}>
            <input
              id="visit-equipment"
              name="equipment"
              type="text"
              placeholder="Cameras, notebooks, recording gear"
              maxLength={500}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-equipment", errors.equipment)}
            />
          </PublicField>
          <PublicField label="Additional Notes" htmlFor="visit-notes" optional error={errors.notes}>
            <textarea
              id="visit-notes"
              name="notes"
              rows={3}
              placeholder="Anything else we should know"
              maxLength={1000}
              className={publicFieldClasses}
              {...fieldErrorProps("visit-notes", errors.notes)}
            />
          </PublicField>
        </div>
        <PrivacyConsent id="visit-consent" purpose="this visit request" error={errors.consent} />
      </section>

      {failure && (
        <FormAlert
          message={failure.message}
          details={failure.details}
          uncertain={failure.outcome === "unknown"}
          onAllowRetry={retryBlocked ? () => setRetryAllowed(true) : undefined}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        {step > 0 ? (
          <Button type="button" variant="outline-forest" onClick={() => goToStep(step - 1)}>
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </Button>
        ) : onCancel ? (
          <Button type="button" variant="outline-forest" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <span />
        )}
        {lastStep ? (
          <Button type="submit" variant="solid-forest" disabled={submitting || retryBlocked || excessVisitorRows} aria-busy={submitting || undefined}>
            {submitting ? "Sending…" : "Submit Request"}
            {!submitting && <ArrowRightIcon className="h-4 w-4" />}
          </Button>
        ) : (
          <Button type="submit" variant="solid-forest">
            Next: {VISIT_FORM_STEPS[step + 1]?.title}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
