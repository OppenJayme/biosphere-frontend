import type { Metadata } from "next";
import Link from "next/link";
import { stagger } from "@/lib/stagger";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How the USC Biological Museum collects, uses and protects the personal information you send through this website.",
};

/*
 * Written by the BioSphere team under the museum's direction (7 Nov 2026: the wording was left
 * to the team). Keep every statement true to what the system actually does; update this page
 * and LAST_UPDATED whenever what is collected, who receives it, or how long it is kept changes.
 */
const LAST_UPDATED = "7 November 2026";
const MUSEUM_EMAIL = "febendanillo@usc.edu.ph";

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <p>
        The USC Biological Museum is part of the University of San Carlos, Cebu City. This notice
        covers the personal information you give us through this website when you request a visit
        or send a general inquiry. We handle it in line with the Data Privacy Act of 2012
        (Republic Act No. 10173) and its implementing rules.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <p>
          <strong className="font-semibold text-ink">Visit requests:</strong> your name, email
          address, phone number, school or organization, address, the purpose of your visit, your
          preferred dates and times, the number of visitors and their names, whether you are
          bringing a vehicle and, if so, its plate number, brand and type, any equipment you plan to
          bring, and any notes you add.
        </p>
        <p>
          <strong className="font-semibold text-ink">General inquiries:</strong> your name, email
          address, and, if you give them, your phone number, school or organization, the topic, a
          visit reference number, and your message.
        </p>
        <p>
          <strong className="font-semibold text-ink">Our replies:</strong> the messages we send you
          about your request, and the notes our curators record while handling it.
        </p>
        <p>
          Browsing the website, viewing exhibits and asking the FAQ assistant do not require any
          personal information. Please do not type personal details into the FAQ assistant.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <>
        <p>We use your information only to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>review and answer your inquiry or visit request, and contact you about it;</li>
          <li>
            schedule an approved visit and arrange your campus entry with the University of San
            Carlos;
          </li>
          <li>keep a record of the requests the museum has received and how each was handled.</li>
        </ul>
        <p>
          We ask for your consent on each form before you send it. We do not use your information
          for marketing, and we do not sell it.
        </p>
      </>
    ),
  },
  {
    id: "who-receives-it",
    title: "Who receives it",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="font-semibold text-ink">Museum curators</strong>, who sign in to
          BioSphere, the museum&apos;s collection and visitor system, to handle requests.
        </li>
        <li>
          <strong className="font-semibold text-ink">The University of San Carlos</strong> offices
          that issue campus entry, for approved visits only: the visitor names, schedule and vehicle
          details needed for entry.
        </li>
        <li>
          <strong className="font-semibold text-ink">Service providers</strong> that run the system
          for us: our hosting and database provider, and the email service that delivers our
          messages to you. They process the information only to provide that service.
        </li>
      </ul>
    ),
  },
  {
    id: "how-long",
    title: "How long we keep it",
    body: (
      <p>
        We keep your request and our replies for as long as the museum needs them to handle your
        request and to keep its visit and inquiry records, following the University&apos;s records
        policies. Finished requests are kept, not deleted automatically. You can ask us to correct
        or delete your information at any time (see below).
      </p>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        Only signed-in museum curators can see visit requests and inquiries, and the system records
        every change they make. Information is sent over encrypted connections. To limit abuse,
        the website briefly uses your device&apos;s network (IP) address to count how many forms are
        sent; that address is not stored with your request.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Under the Data Privacy Act you may ask to be informed about and to access the personal
          information we hold about you, have it corrected, object to its use, have it deleted or
          blocked, and withdraw your consent. Withdrawing consent may mean we can no longer process
          a pending request.
        </p>
        <p>
          You may also file a complaint with the{" "}
          <a
            href="https://privacy.gov.ph"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand underline-offset-4 hover:underline"
          >
            National Privacy Commission
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        For questions or requests about your information, email the museum at{" "}
        <a
          href={`mailto:${MUSEUM_EMAIL}`}
          className="break-all font-medium text-brand underline-offset-4 hover:underline"
        >
          {MUSEUM_EMAIL}
        </a>{" "}
        or send a{" "}
        <Link href="/inquiry" className="font-medium text-brand underline-offset-4 hover:underline">
          general inquiry
        </Link>
        . Please include your visit reference number if you have one. You may also raise a concern
        with the University of San Carlos Data Protection Officer.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pt-12 sm:px-8 lg:grid-cols-12 lg:pt-20">
      <header className="lg:col-span-4">
        <h1 className="rise font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink">
          Privacy notice
        </h1>
        <p className="rise mt-6 text-lg leading-relaxed text-ink-muted" style={stagger(1)}>
          How we handle the details you send us when you request a visit or ask a question.
        </p>
        <p className="rise mt-4 text-sm text-ink-muted" style={stagger(2)}>
          Last updated {LAST_UPDATED}
        </p>
        <nav aria-label="On this page" className="rise mt-8 hidden lg:block" style={stagger(2)}>
          <ul className="space-y-2 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-ink-muted hover:text-brand">
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div
        className="rise min-w-0 space-y-10 rounded-2xl border border-line bg-surface p-6 sm:p-10 lg:col-span-7 lg:col-start-6"
        style={stagger(2)}
      >
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
            <h2 id={`${section.id}-title`} className="font-display text-2xl font-semibold tracking-tight text-ink">
              {section.title}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink-muted">{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
