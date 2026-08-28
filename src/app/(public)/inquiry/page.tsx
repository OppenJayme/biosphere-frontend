import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiry/InquiryForm";

export const metadata: Metadata = {
  title: "General Inquiry",
  description:
    "Send a general inquiry to the USC Biological Museum curators.",
};

export default function InquiryPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-forest-900">
          General Inquiry
        </h1>
        <p className="mt-3 text-zinc-600">
          Send us a message and a curator will follow up by email. This form
          is not monitored in real time &mdash; for urgent visit requests,
          use the{" "}
          <Link href="/visit" className="font-medium text-forest-700 hover:underline">
            Request a Visit
          </Link>{" "}
          option instead.
        </p>
      </header>

      <div className="mt-10 rounded-2xl border border-black/10 p-6 sm:p-8">
        <InquiryForm />
      </div>
    </div>
  );
}
