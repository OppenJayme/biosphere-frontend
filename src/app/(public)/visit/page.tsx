import type { Metadata } from "next";
import Image from "next/image";
import { VisitOptionsSection } from "@/components/visit/VisitOptionsSection";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { stagger } from "@/lib/stagger";
import { BookOpenIcon, CalendarIcon, InfoIcon, LeafIcon, ShieldIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Visit",
  description:
    "Choose how to connect with the USC Biological Museum: request a visit or send a general inquiry.",
};

const AT_A_GLANCE = [
  { icon: LeafIcon, label: "Immersive learning", description: "Discover biodiversity up close." },
  {
    icon: BookOpenIcon,
    label: "Educational experience",
    description: "Perfect for students, researchers, and families.",
  },
  { icon: ShieldIcon, label: "Safe and welcoming", description: "A comfortable environment for all visitors." },
  {
    icon: CalendarIcon,
    label: "Easy and convenient",
    description: "Plan your visit or send an inquiry in advance.",
  },
];

const NEXT_STEPS = [
  "Choose a request type",
  "Fill out the required details",
  "Wait for museum confirmation",
];

const BEFORE_YOU_VISIT = [
  "Arrive on time for your confirmed schedule",
  "Food and drinks are not allowed inside exhibits",
  "Handle specimens and displays with care",
  "Flash photography may be restricted",
  "Large group visits require advance request",
];

const CONTACT_ROWS = [
  { label: "Address", value: "USC Biological Museum, University of San Carlos, Cebu City" },
  { label: "Email", value: "febendanillo@usc.edu.ph", href: "mailto:febendanillo@usc.edu.ph" },
  { label: "Mobile", value: "0945 866 8586", href: "tel:+639458668586" },
  { label: "Telephone", value: "2300100-122 local 122" },
];

export default function VisitPage() {
  return (
    <>
      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 pt-12 pb-16 sm:px-8 lg:grid-cols-12 lg:items-center lg:pt-20">
        <div className="lg:col-span-5">
          <h1 className="rise font-display text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl">
            Plan your visit
          </h1>
          <p className="rise mt-6 max-w-[40ch] text-lg leading-relaxed text-ink-muted" style={stagger(1)}>
            We&apos;re excited to welcome you. Choose how you&apos;d like to connect
            with the USC Biological Museum.
          </p>
        </div>
        <div
          className="rise relative aspect-3/2 overflow-hidden rounded-2xl lg:col-span-7"
          style={stagger(2)}
        >
          <Image
            src={PLACEHOLDER_IMAGES.heroVisit}
            alt="A visitor looking up at a dinosaur fossil in a museum hall"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <ul className="grid grid-cols-1 gap-8 border-y border-line py-10 sm:grid-cols-2 lg:grid-cols-4">
          {AT_A_GLANCE.map((item) => (
            <li key={item.label} className="reveal flex gap-4">
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8">
        <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Choose your visit option
        </h2>
        <div className="mt-10">
          <VisitOptionsSection />
        </div>

        <h3 className="reveal mt-20 font-display text-2xl font-semibold tracking-tight text-ink">
          What happens next?
        </h3>
        <ol className="mt-8 grid gap-6 md:grid-cols-3 md:gap-0">
          {NEXT_STEPS.map((step, index) => (
            <li key={step} className="reveal relative flex items-center gap-4 md:flex-col md:items-start md:gap-5">
              <div className="flex items-center md:w-full">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-surface font-mono text-sm text-brand">
                  {index + 1}
                </span>
                {index < NEXT_STEPS.length - 1 && (
                  <span aria-hidden className="ml-4 hidden h-px flex-1 bg-line md:block" />
                )}
              </div>
              <p className="font-medium text-ink md:pr-10">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="reveal lg:col-span-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Before you visit</h2>
          <ul className="mt-6 space-y-4">
            {BEFORE_YOU_VISIT.map((item) => (
              <li key={item} className="flex gap-3 text-ink-muted">
                <span aria-hidden className="mt-[0.6rem] h-px w-4 shrink-0 bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal rounded-2xl border border-line bg-surface p-7 sm:p-9 lg:col-span-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Museum contact</h2>
          <dl className="mt-6 space-y-4">
            {CONTACT_ROWS.map((row) => (
              <div key={row.label} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                <dt className="font-mono text-xs uppercase tracking-[0.12em] text-ink-muted sm:pt-0.5">
                  {row.label}
                </dt>
                <dd className="text-ink">
                  {row.href ? (
                    <a href={row.href} className="hover:text-brand hover:underline">
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-7 flex gap-3 rounded-xl bg-brand-soft p-4 text-sm text-ink">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            For urgent concerns, please contact the museum before your intended visit.
          </p>
        </div>
      </section>
    </>
  );
}
