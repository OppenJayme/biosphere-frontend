"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field, FieldError, FieldGroupLabel, fieldClasses, fieldErrorId, fieldErrorProps } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, PlusIcon, CloseIcon } from "@/components/icons";
import { FormAlert, PrivacyConsent, SubmissionSuccess, focusFirstInvalid } from "@/components/public-forms/FormParts";
import type { FieldErrors } from "@/features/public-submissions/form-fields";
import { MAX_PREFERRED_SCHEDULES, MAX_VISITOR_COUNT, museumToday } from "@/features/public-submissions/schedule";
import {
  postPublicSubmission,
  type SubmissionReceipt,
  type SubmissionResult,
} from "@/features/public-submissions/submit";
import { readVisitRequestForm, type VisitFormField } from "@/features/visit-requests/form";

let rowIdCounter = 0;
function nextRowId() {
  rowIdCounter += 1;
  return rowIdCounter;
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
  const [scheduleRows, setScheduleRows] = useState<number[]>(() => [nextRowId()]);
  const [visitorRows, setVisitorRows] = useState<number[]>(() => [nextRowId()]);
  const [bringingVehicle, setBringingVehicle] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<VisitFormField>>({});
  const [scheduleErrors, setScheduleErrors] = useState<(string | undefined)[]>([]);
  const [failure, setFailure] = useState<Extract<SubmissionResult, { ok: false }> | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (receipt) {
    return (
      <SubmissionSuccess
        title="Your visit request was sent"
        receipt={receipt}
        onDone={onSubmitted}
        onAnother={() => {
          setReceipt(null);
          setScheduleRows([nextRowId()]);
          setVisitorRows([nextRowId()]);
          setBringingVehicle(false);
          setFormKey((key) => key + 1);
        }}
      >
        <p>
          Thank you. A curator will check your preferred schedules and email you once one is
          approved. Your visit is not confirmed until you hear from us.
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
    if (submitting) return;

    const parsed = readVisitRequestForm(new FormData(event.currentTarget), today);
    setFailure(null);
    if (!parsed.success) {
      setErrors(parsed.errors);
      setScheduleErrors(parsed.scheduleErrors);
      focusFirstInvalid(formRef.current);
      return;
    }

    setErrors({});
    setScheduleErrors([]);
    setSubmitting(true);
    const result = await postPublicSubmission("/visit-requests", parsed.data);
    setSubmitting(false);

    if (result.ok) setReceipt(result.receipt);
    else setFailure(result);
  }

  return (
    <form key={formKey} ref={formRef} noValidate className="space-y-8" onSubmit={handleSubmit}>
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

      <fieldset className="space-y-4" aria-describedby="visit-schedule-hint">
        <legend className="contents">
          <FieldGroupLabel>Preferred Schedules</FieldGroupLabel>
        </legend>
        <p id="visit-schedule-hint" className="text-sm text-ink-muted">
          List up to {MAX_PREFERRED_SCHEDULES} options, most preferred first. A curator will approve one of them.
        </p>

        <ol className="space-y-3">
          {scheduleRows.map((rowId, index) => {
            const rowError = scheduleErrors[index];
            const errorId = `schedule-${rowId}-error`;
            const invalid = rowError ? { "aria-invalid": true as const, "aria-describedby": errorId } : {};
            return (
              <li key={rowId} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-ink">Option {index + 1}</p>
                  {scheduleRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleRows((rows) => rows.filter((id) => id !== rowId));
                        setScheduleErrors([]);
                      }}
                      aria-label={`Remove option ${index + 1}`}
                      className="rounded-lg p-1.5 text-ink-muted hover:bg-brand-soft hover:text-brand"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-2 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
                  <Field label="Date" htmlFor={`schedule-date-${rowId}`}>
                    <input
                      id={`schedule-date-${rowId}`}
                      name="scheduleDate"
                      type="date"
                      min={today}
                      required
                      className={fieldClasses}
                      {...invalid}
                    />
                  </Field>
                  <Field label="Start Time" htmlFor={`schedule-start-${rowId}`}>
                    <input
                      id={`schedule-start-${rowId}`}
                      name="scheduleStart"
                      type="time"
                      required
                      className={fieldClasses}
                      {...invalid}
                    />
                  </Field>
                  <Field label="End Time" htmlFor={`schedule-end-${rowId}`}>
                    <input
                      id={`schedule-end-${rowId}`}
                      name="scheduleEnd"
                      type="time"
                      required
                      className={fieldClasses}
                      {...invalid}
                    />
                  </Field>
                </div>
                {rowError && <FieldError id={errorId}>{rowError}</FieldError>}
              </li>
            );
          })}
        </ol>
        {errors.schedules && <FieldError id="visit-schedules-error">{errors.schedules}</FieldError>}

        {scheduleRows.length < MAX_PREFERRED_SCHEDULES && (
          <button
            type="button"
            onClick={() => setScheduleRows((rows) => [...rows, nextRowId()])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <PlusIcon className="h-4 w-4" />
            Add another option
          </button>
        )}
      </fieldset>

      <div className="space-y-4">
        <FieldGroupLabel>Visitors</FieldGroupLabel>
        <div className="sm:max-w-[16rem]">
          <Field label="Number of Visitors" htmlFor="visit-count" error={errors.visitorCount}>
            <input
              id="visit-count"
              name="visitorCount"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_VISITOR_COUNT}
              defaultValue={1}
              required
              className={fieldClasses}
              {...fieldErrorProps("visit-count", errors.visitorCount)}
            />
          </Field>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-ink-muted">
            Visitor names <span className="font-normal text-ink-muted/80">(optional, used for campus entry)</span>
          </legend>
          {visitorRows.map((rowId, index) => (
            <div key={rowId} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <Field label="First Name" htmlFor={`visitor-first-${rowId}`}>
                <input
                  id={`visitor-first-${rowId}`}
                  name="visitorFirstName"
                  type="text"
                  placeholder="Juan"
                  maxLength={50}
                  className={fieldClasses}
                  {...fieldErrorProps("visit-visitors", errors.visitors)}
                />
              </Field>
              <Field label="Last Name" htmlFor={`visitor-last-${rowId}`}>
                <input
                  id={`visitor-last-${rowId}`}
                  name="visitorLastName"
                  type="text"
                  placeholder="Dela Cruz"
                  maxLength={49}
                  className={fieldClasses}
                />
              </Field>
              <button
                type="button"
                disabled={visitorRows.length === 1}
                onClick={() => setVisitorRows((rows) => rows.filter((id) => id !== rowId))}
                aria-label={`Remove visitor ${index + 1}`}
                className="rounded-lg p-2.5 text-ink-muted hover:bg-brand-soft hover:text-brand disabled:invisible"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {errors.visitors && <FieldError id={fieldErrorId("visit-visitors")}>{errors.visitors}</FieldError>}
        </fieldset>

        {visitorRows.length < MAX_VISITOR_COUNT && (
          <button
            type="button"
            onClick={() => setVisitorRows((rows) => [...rows, nextRowId()])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            <PlusIcon className="h-4 w-4" />
            Add a visitor name
          </button>
        )}
      </div>

      <fieldset className="space-y-4">
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
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Plate Number" htmlFor="visit-plate" error={errors.plateNumber}>
              <input
                id="visit-plate"
                name="plateNumber"
                type="text"
                placeholder="ABC 1234"
                required
                maxLength={20}
                className={fieldClasses}
                {...fieldErrorProps("visit-plate", errors.plateNumber)}
              />
            </Field>
            <Field label="Car Brand" htmlFor="visit-car-brand" optional error={errors.carBrand}>
              <input
                id="visit-car-brand"
                name="carBrand"
                type="text"
                placeholder="Toyota"
                maxLength={100}
                className={fieldClasses}
                {...fieldErrorProps("visit-car-brand", errors.carBrand)}
              />
            </Field>
            <Field label="Car Type" htmlFor="visit-car-type" optional error={errors.carType}>
              <input
                id="visit-car-type"
                name="carType"
                type="text"
                placeholder="Van, Sedan, School Bus"
                maxLength={100}
                className={fieldClasses}
                {...fieldErrorProps("visit-car-type", errors.carType)}
              />
            </Field>
          </div>
        )}
      </fieldset>

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

      <PrivacyConsent id="visit-consent" purpose="this visit request" error={errors.consent} />

      {failure && <FormAlert message={failure.message} details={failure.details} />}

      <div className="flex justify-end gap-3 border-t border-line pt-6">
        {onCancel && (
          <Button type="button" variant="outline-forest" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="solid-forest" disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? "Sending…" : "Submit Request"}
          {!submitting && <ArrowRightIcon className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
