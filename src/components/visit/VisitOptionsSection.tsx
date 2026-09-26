"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/visit/Modal";
import { RequestVisitForm } from "@/components/visit/RequestVisitForm";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { ArrowRightIcon, CalendarIcon, CheckIcon, MailIcon } from "@/components/icons";

const REQUEST_VISIT_POINTS = [
  "Guided tours",
  "Educational programs available",
  "Advance reservation required",
];

const GENERAL_INQUIRY_POINTS = [
  "Ask about the museum",
  "Inquire about the tour",
  "Other concerns or feedback",
];

export function VisitOptionsSection() {
  const [openModal, setOpenModal] = useState<"visit" | "inquiry" | null>(null);

  return (
    <>
      {/* Weighted pair: a visit request is the primary path, an inquiry the secondary one. */}
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="reveal flex flex-col rounded-2xl bg-brand-soft p-8 sm:p-10 lg:col-span-7">
          <CalendarIcon className="h-7 w-7 text-brand" />
          <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
            Request a visit
          </h3>
          <p className="mt-2 max-w-md text-ink-muted">
            Schedule a visit for yourself, your class, or your organization.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {REQUEST_VISIT_POINTS.map((point) => (
              <li
                key={point}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-1.5 text-sm text-ink"
              >
                <CheckIcon className="h-3.5 w-3.5 text-brand" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-10">
            <Button onClick={() => setOpenModal("visit")}>
              Request a visit
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="reveal flex flex-col rounded-2xl border border-line bg-surface p-8 sm:p-10 lg:col-span-5">
          <MailIcon className="h-7 w-7 text-accent" />
          <h3 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
            General inquiry
          </h3>
          <p className="mt-2 text-ink-muted">
            Have a question or need assistance? We&apos;re here to help.
          </p>
          <ul className="mt-6 space-y-2.5">
            {GENERAL_INQUIRY_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2.5 text-sm text-ink">
                <CheckIcon className="h-4 w-4 text-brand" />
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-10">
            <Button variant="outline-forest" onClick={() => setOpenModal("inquiry")}>
              Send an inquiry
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {openModal === "visit" && (
        <Modal
          title="Request a Visit"
          description="Tell us about your planned visit to the museum."
          onClose={() => setOpenModal(null)}
        >
          <RequestVisitForm onCancel={() => setOpenModal(null)} onSubmitted={() => setOpenModal(null)} />
        </Modal>
      )}

      {openModal === "inquiry" && (
        <Modal title="Inquiry" description="Tell us your concerns." onClose={() => setOpenModal(null)}>
          <InquiryForm onCancel={() => setOpenModal(null)} onSubmitted={() => setOpenModal(null)} />
        </Modal>
      )}
    </>
  );
}
