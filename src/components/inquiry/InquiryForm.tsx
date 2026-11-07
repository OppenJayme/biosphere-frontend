"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field, FieldGroupLabel, fieldClasses, fieldErrorId, fieldErrorProps } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";
import { FormAlert, PrivacyConsent, SubmissionSuccess, focusFirstInvalid } from "@/components/public-forms/FormParts";
import { readInquiryForm, type InquiryFormField } from "@/features/inquiries/form";
import { INQUIRY_TYPES, VISIT_FOLLOW_UP_TYPE } from "@/features/inquiries/workflow";
import type { FieldErrors } from "@/features/public-submissions/form-fields";
import {
  postPublicSubmission,
  type SubmissionReceipt,
  type SubmissionResult,
} from "@/features/public-submissions/submit";

export function InquiryForm({
  onCancel,
  onSubmitted,
}: {
  onCancel?: () => void;
  onSubmitted?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors<InquiryFormField>>({});
  const [failure, setFailure] = useState<Extract<SubmissionResult, { ok: false }> | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retryAllowed, setRetryAllowed] = useState(false);
  const retryBlocked = failure?.outcome === "unknown" && !retryAllowed;
  // Remounts the form (clearing every field) after "Send another".
  const [formKey, setFormKey] = useState(0);
  const [topic, setTopic] = useState("GENERAL");
  const visitFollowUp = topic === VISIT_FOLLOW_UP_TYPE;

  if (receipt) {
    return (
      <SubmissionSuccess
        title="Your inquiry was sent"
        receipt={receipt}
        onDone={onSubmitted}
        onAnother={() => {
          setReceipt(null);
          setTopic("GENERAL");
          setFormKey((key) => key + 1);
        }}
      >
        <p>
          Thank you for reaching out. A curator will review your message and reply to the email
          address you gave us.
        </p>
      </SubmissionSuccess>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || retryBlocked) return;

    const parsed = readInquiryForm(new FormData(event.currentTarget));
    setFailure(null);
    if (!parsed.success) {
      setErrors(parsed.errors);
      focusFirstInvalid(formRef.current);
      return;
    }

    setErrors({});
    setRetryAllowed(false);
    setSubmitting(true);
    const result = await postPublicSubmission("/inquiries", parsed.data);
    setSubmitting(false);

    if (result.ok) setReceipt(result.receipt);
    else setFailure(result);
  }

  return (
    <form key={formKey} ref={formRef} noValidate className="@container space-y-6" onSubmit={handleSubmit}>
      {/* Two columns only when the form itself is wide (the desktop modal); the /inquiry page
          card is narrower, so it keeps one column like phones. */}
      <div className="grid gap-6 @3xl:grid-cols-2 @3xl:items-start @3xl:gap-x-10">
        <div className="space-y-4">
          <FieldGroupLabel>Contact Details</FieldGroupLabel>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your Name" htmlFor="inquiry-name" error={errors.name}>
              <input
                id="inquiry-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Juan Dela Cruz"
                required
                maxLength={100}
                className={fieldClasses}
                {...fieldErrorProps("inquiry-name", errors.name)}
              />
            </Field>
            <Field label="Email Address" htmlFor="inquiry-email" error={errors.email}>
              <input
                id="inquiry-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@school.edu.ph"
                required
                maxLength={100}
                className={fieldClasses}
                {...fieldErrorProps("inquiry-email", errors.email)}
              />
            </Field>
            <Field label="Contact Number" htmlFor="inquiry-phone" optional error={errors.phone}>
              <input
                id="inquiry-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="0917 123 4567"
                maxLength={20}
                className={fieldClasses}
                {...fieldErrorProps("inquiry-phone", errors.phone)}
              />
            </Field>
            <Field label="Organization / School" htmlFor="inquiry-org" optional error={errors.organization}>
              <input
                id="inquiry-org"
                name="organization"
                type="text"
                autoComplete="organization"
                placeholder="University of San Carlos"
                maxLength={100}
                className={fieldClasses}
                {...fieldErrorProps("inquiry-org", errors.organization)}
              />
            </Field>
          </div>
        </div>

        <div className="space-y-4">
          <FieldGroupLabel>Inquiry</FieldGroupLabel>
          <Field label="Topic" htmlFor="inquiry-type" error={errors.inquiryType}>
            <select
              id="inquiry-type"
              name="inquiryType"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className={fieldClasses}
              {...fieldErrorProps("inquiry-type", errors.inquiryType)}
            >
              {INQUIRY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
          {visitFollowUp && (
            <Field
              label="Visit Request Reference Number"
              htmlFor="inquiry-visit-reference"
              optional
              error={errors.visitReferenceCode}
            >
              <input
                id="inquiry-visit-reference"
                name="visitReferenceCode"
                type="text"
                autoComplete="off"
                placeholder="e.g. 9A81836F"
                maxLength={8}
                className={`${fieldClasses} font-mono uppercase`}
                {...fieldErrorProps("inquiry-visit-reference", errors.visitReferenceCode)}
                aria-describedby={[
                  "inquiry-visit-reference-hint",
                  errors.visitReferenceCode && fieldErrorId("inquiry-visit-reference"),
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              <p id="inquiry-visit-reference-hint" className="mt-1.5 text-xs text-ink-muted">
                Found in your visit request email and on the confirmation screen.
              </p>
            </Field>
          )}
          <Field label="Message" htmlFor="inquiry-message" error={errors.message}>
            <textarea
              id="inquiry-message"
              name="message"
              rows={5}
              placeholder={
                visitFollowUp
                  ? "Tell us what you need, e.g. a different date, a new visitor count, or a cancellation."
                  : "What would you like to ask the museum?"
              }
              required
              maxLength={2000}
              className={fieldClasses}
              {...fieldErrorProps("inquiry-message", errors.message)}
            />
          </Field>
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

      {/* Wide form: consent beside the buttons to save a row. */}
      <div className="space-y-6 pt-2 @3xl:flex @3xl:items-center @3xl:gap-8 @3xl:space-y-0">
        <div className="@3xl:flex-1">
          <PrivacyConsent id="inquiry-consent" purpose="this inquiry" error={errors.consent} />
        </div>
        <div className="flex shrink-0 justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline-forest" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" variant="solid-forest" disabled={submitting || retryBlocked} aria-busy={submitting || undefined}>
            {submitting ? "Sending…" : "Send Inquiry"}
            {!submitting && <ArrowRightIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
