/**
 * Safe state for a QR exhibit URL that has nothing public to show (REQ-4.12-09). It never says
 * whether the page existed, was unpublished, disabled, or archived, and shows no earlier content.
 */

import Link from "next/link";
import { QrCodeIcon } from "@/components/icons";

const COPY = {
  unavailable: {
    title: "This exhibit is not available",
    body: "The page for this QR code or link isn't available right now. It may have been taken down or moved.",
  },
  error: {
    title: "We couldn't load this exhibit",
    body: "Something went wrong on our side. Please try again in a moment.",
  },
} as const;

export function ExhibitUnavailable({ reason }: { reason: keyof typeof COPY }) {
  const copy = COPY[reason];
  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-forest-700">
        <QrCodeIcon className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-serif text-2xl font-semibold text-forest-900">{copy.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{copy.body}</p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
        You can still explore the museum&rsquo;s gallery or ask the museum a question.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/gallery"
          className="rounded-full bg-forest-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-900"
        >
          Visit the gallery
        </Link>
        <Link
          href="/inquiry"
          className="rounded-full border border-forest-800 px-5 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
        >
          Ask a question
        </Link>
      </div>
    </section>
  );
}
