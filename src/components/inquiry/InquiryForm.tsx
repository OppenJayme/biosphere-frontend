"use client";

import { Field, FieldGroupLabel, fieldClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/icons";

export function InquiryForm({
  onCancel,
  onSubmitted,
}: {
  onCancel?: () => void;
  onSubmitted?: () => void;
}) {
  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        // No backend yet — features/inquiries will wire this to a Server Action.
        onSubmitted?.();
      }}
    >
      <div className="space-y-4">
        <FieldGroupLabel>Contact Details</FieldGroupLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Person Name" htmlFor="inquiry-name">
            <input
              id="inquiry-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              required
              className={fieldClasses}
            />
          </Field>
          <Field label="Email Address" htmlFor="inquiry-email">
            <input
              id="inquiry-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@school.edu.ph"
              required
              className={fieldClasses}
            />
          </Field>
          <Field label="Contact Number" htmlFor="inquiry-phone">
            <input
              id="inquiry-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              className={fieldClasses}
            />
          </Field>
          <Field label="Organization / School" htmlFor="inquiry-org">
            <input
              id="inquiry-org"
              name="organization"
              type="text"
              placeholder="University of San Carlos"
              className={fieldClasses}
            />
          </Field>
        </div>

        <Field label="Address" htmlFor="inquiry-address">
          <input
            id="inquiry-address"
            name="address"
            type="text"
            placeholder="Street, City, Province"
            className={fieldClasses}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <FieldGroupLabel>Inquiry</FieldGroupLabel>
        <Field label="Message" htmlFor="inquiry-message">
          <textarea
            id="inquiry-message"
            name="message"
            rows={4}
            placeholder="Field trip, research, class requirement, etc."
            required
            className={fieldClasses}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline-forest" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="solid-forest">
          Submit Request
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
