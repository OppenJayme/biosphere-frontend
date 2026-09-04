import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { VisitOptionsSection } from "@/components/visit/VisitOptionsSection";
import {
  BookOpenIcon,
  CalendarIcon,
  InfoIcon,
  LeafIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Visit",
  description:
    "Choose how to connect with the USC Biological Museum — request a visit or send a general inquiry.",
};

const HERO_FEATURES = [
  { icon: LeafIcon, label: "Immersive Learning", description: "Discover biodiversity up close." },
  {
    icon: BookOpenIcon,
    label: "Educational Experience",
    description: "Perfect for students, researchers & families.",
  },
  { icon: ShieldIcon, label: "Safe & Welcoming", description: "A comfortable environment for all visitors." },
  {
    icon: CalendarIcon,
    label: "Easy & Convenient",
    description: "Plan your visit or send an inquiry in advance.",
  },
];

const STEPS = [
  { number: 1, label: "Choose a request type" },
  { number: 2, label: "Fill out the required details" },
  { number: 3, label: "Wait for museum confirmation" },
];

const BEFORE_YOU_VISIT = [
  "Arrive on time for your confirmed schedule",
  "Food and drinks are not allowed inside exhibits",
  "Handle specimens and displays with care",
  "Flash photography may be restricted",
  "Large group visits require advance request",
];

export default function VisitPage() {
  return (
    <>
      <PageHero
        title="Plan Your Visit"
        description="We're excited to welcome you! Choose how you'd like to connect with USC Biological Museum."
        features={HERO_FEATURES}
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center font-serif text-3xl font-semibold text-forest-900">
          Choose Your Visit Option
        </h2>

        <div className="mt-10">
          <VisitOptionsSection />
        </div>

        <div className="mt-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-black/10" />
          <h3 className="font-serif text-xl font-semibold text-forest-900">
            What Happens Next?
          </h3>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center">
                <div className={`h-px flex-1 ${index === 0 ? "invisible" : "border-t border-dashed border-forest-700/40"}`} />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-lg font-semibold text-forest-800">
                  {step.number}
                </span>
                <div className={`h-px flex-1 ${index === STEPS.length - 1 ? "invisible" : "border-t border-dashed border-forest-700/40"}`} />
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-700">{step.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-8">
            <h3 className="font-serif text-xl font-semibold text-forest-900">
              Before You Visit
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
              {BEFORE_YOU_VISIT.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-forest-700" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-black/10 p-8">
            <h3 className="font-serif text-xl font-semibold text-forest-900">
              Museum Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-600">
              <li className="flex gap-2.5">
                <MapPinIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
                <span>USC Biological Museum, University of San Carlos, Cebu City</span>
              </li>
              <li className="flex gap-2.5">
                <MailIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
                <span>febendanillo@usc.edu.ph</span>
              </li>
              <li className="flex gap-2.5">
                <PhoneIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
                <span>Contact #: 0945 866 8586</span>
              </li>
              <li className="flex gap-2.5">
                <PhoneIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
                <span>Telephone #: 2300100-122 local 122</span>
              </li>
            </ul>

            <div className="mt-5 flex gap-2.5 rounded-xl bg-gold-100 p-4 text-xs text-gold-700">
              <InfoIcon className="h-4 w-4 shrink-0" />
              For urgent concerns, please contact the museum before your intended visit.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
