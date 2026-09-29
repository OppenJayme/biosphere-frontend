"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field, FieldGroupLabel, fieldClasses, fieldErrorProps } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";
import { FormAlert, PrivacyConsent, SubmissionSuccess, focusFirstInvalid } from "@/components/public-forms/FormParts";
import { readInquiryForm, type InquiryFormField } from "@/features/inquiries/form";
import { INQUIRY_TYPES } from "@/features/inquiries/workflow";
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
  // Remounts the form (clearing every field) after "Send another".
  const [formKey, setFormKey] = useState(0);

  if (receipt) {
    return (
      <SubmissionSuccess
        title="Your inquiry was sent"
        receipt={receipt}
        onDone={onSubmitted}
        onAnother={() => {
          setReceipt(null);
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
    if (submitting) return;

    const parsed = readInquiryForm(new FormData(event.currentTarget));
    setFailure(null);
    if (!parsed.success) {
      setErrors(parsed.errors);
      focusFirstInvalid(formRef.current);
      return;
    }

    setErrors({});
    setSubmitting(true);
    const result = await postPublicSubmission("/inquiries", parsed.data);
    setSubmitting(false);

    if (result.ok) setReceipt(result.receipt);
    else setFailure(result);
  }

  return (
    <form key={formKey} ref={formRef} noValidate className="space-y-6" onSubmit={handleSubmit}>
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
            defaultValue="GENERAL"
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
        <Field label="Message" htmlFor="inquiry-message" error={errors.message}>
          <textarea
            id="inquiry-message"
            name="message"
            rows={5}
            placeholder="What would you like to ask the museum?"
            required
            maxLength={2000}
            className={fieldClasses}
            {...fieldErrorProps("inquiry-message", errors.message)}
          />
        </Field>
      </div>

      <PrivacyConsent id="inquiry-consent" purpose="this inquiry" error={errors.consent} />

      {failure && <FormAlert message={failure.message} details={failure.details} />}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline-forest" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="solid-forest" disabled={submitting} aria-busy={submitting || undefined}>
          {submitting ? "Sending…" : "Send Inquiry"}
          {!submitting && <ArrowRightIcon className="h-4 w-4" />}
        </Button>
      </div>
    </form>
  );
}
