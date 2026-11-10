import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiry/InquiryForm";
import { stagger } from "@/lib/stagger";

export const metadata: Metadata = {
  title: "General Inquiry",
  description:
    "Send a general inquiry to the USC Biological Museum curators.",
};

export default function InquiryPage() {
  return (
    <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pt-12 sm:px-8 lg:grid-cols-12 lg:pt-20">
      <header className="lg:col-span-4">
        <h1 className="rise font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          General inquiry
        </h1>
        <p className="rise mt-6 text-lg leading-relaxed text-ink-muted" style={stagger(1)}>
          Send us a message and a curator will follow up by email.
        </p>
        <p className="rise mt-4 text-sm leading-relaxed text-ink-muted" style={stagger(2)}>
          This form is not monitored in real time. For urgent visit requests,
          use the{" "}
          <Link href="/visit" className="font-medium text-brand underline-offset-4 hover:underline">
            Request a visit
          </Link>{" "}
          option instead.
        </p>
      </header>

      <div
        className="rise rounded-2xl border border-line bg-surface p-6 sm:p-10 lg:col-span-7 lg:col-start-6"
        style={stagger(2)}
      >
        <InquiryForm />
      </div>
    </div>
  );
}
