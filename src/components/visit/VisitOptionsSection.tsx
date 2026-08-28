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
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-700 text-white">
            <CalendarIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-serif text-xl font-semibold text-forest-900">
            Request a Visit
          </h3>
          <p className="mt-1.5 text-sm text-zinc-600">
            Schedule a visit for yourself, your class, or your organization.
          </p>
          <ul className="mt-5 space-y-2.5">
            {REQUEST_VISIT_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckIcon className="h-4 w-4 text-forest-700" />
                {point}
              </li>
            ))}
          </ul>
          <Button className="mt-6 w-full" onClick={() => setOpenModal("visit")}>
            Request A Visit
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-black/10 p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-600 text-white">
            <MailIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-serif text-xl font-semibold text-forest-900">
            General Inquiry
          </h3>
          <p className="mt-1.5 text-sm text-zinc-600">
            Have a question or need assistance? We&apos;re here to help.
          </p>
          <ul className="mt-5 space-y-2.5">
            {GENERAL_INQUIRY_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-zinc-700">
                <CheckIcon className="h-4 w-4 text-gold-600" />
                {point}
              </li>
            ))}
          </ul>
          <Button
            variant="solid-gold"
            className="mt-6 w-full"
            onClick={() => setOpenModal("inquiry")}
          >
            Send an Inquiry
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
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
