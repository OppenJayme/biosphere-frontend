import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/Button";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalendarIcon,
  GlobeIcon,
  LeafIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "The mission and history of the University of San Carlos Biological Museum.",
};

const MISSION_POINTS = [
  {
    icon: LeafIcon,
    title: "Mission",
    description:
      "Preserve and document biological collections to advance learning, research, and the understanding of life's diversity.",
  },
  {
    icon: BookOpenIcon,
    title: "Education",
    description:
      "Inspire learners of all ages through engaging exhibits, guided tours, and hands-on experiences.",
  },
  {
    icon: GlobeIcon,
    title: "Conservation",
    description:
      "Promote awareness and appreciation of Philippine biodiversity and encourage responsible stewardship.",
  },
];

const CURATORIAL_TEAM = [
  {
    name: "Ivan Jayme",
    role: "Museum Director",
    description: "Oversees collections, research programs, and partnerships.",
    phone: "+63 XXX XXX XXXX",
    email: "ivan.jayme@usc.edu.ph",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About the USC Biological Museum"
        description="The USC Biological Museum preserves the rich biodiversity of the Philippines through curated collections, research, education, and public engagement."
        actions={<Button href="/gallery">Explore Exhibits</Button>}
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-forest-900">
              Our History
            </h2>
            <p className="mt-4 text-zinc-700">
              The University of San Carlos Biological Museum was founded in
              1952 by the German priest and entomologist{" "}
              <strong className="font-semibold text-forest-900">Enrique Schoenig</strong>.
            </p>
            <p className="mt-4 text-zinc-700">
              It was formally inaugurated as part of the broader University of
              San Carlos on April 23, 1967, and its collections are now
              maintained in collaboration with the university&apos;s Department
              of Biology.
            </p>

            <div className="mt-8 flex items-center gap-6 border-t border-black/10 pt-6">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-700">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <p className="text-sm text-zinc-600">
                  A legacy of learning and discovery that continues to inspire
                  generations.
                </p>
              </div>
              <div className="shrink-0 border-l border-black/10 pl-6">
                <p className="font-serif text-lg font-semibold text-forest-900">Est. 1952</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-sage-100 p-6">
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
              <Image
                src={PLACEHOLDER_IMAGES.historyTiger}
                alt="A specimen from the museum's collection"
                fill
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="object-cover"
              />
            </div>
            <h3 className="mt-5 font-serif text-xl font-semibold text-forest-900">
              Through the Years
            </h3>
            <p className="mt-2 text-sm text-zinc-700">
              Our collections have grown through donations, fieldwork, and
              research partnerships — preserving specimens that tell the story
              of Philippine biodiversity.
            </p>
            <Button href="/gallery" variant="outline-forest" className="mt-4 px-4 py-2 text-xs">
              Learn more about the collection
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {MISSION_POINTS.map((point) => (
            <div key={point.title} className="rounded-2xl border border-black/10 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-forest-700">
                <point.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-serif text-lg font-semibold text-forest-900">
                {point.title}
              </p>
              <p className="mt-1.5 text-sm text-zinc-600">{point.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="curatorial-team" className="scroll-mt-24 border-t border-black/10 bg-sage-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-3xl font-semibold text-forest-900">
            Curatorial Team
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CURATORIAL_TEAM.map((member) => (
              <div key={member.name} className="rounded-2xl border border-black/10 bg-white p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 font-serif text-lg font-semibold text-forest-800">
                  {member.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                <p className="mt-4 font-serif text-lg font-semibold text-forest-900">
                  {member.name}
                </p>
                <p className="text-sm font-medium text-gold-600">{member.role}</p>
                <p className="mt-2 text-sm text-zinc-600">{member.description}</p>

                <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 text-xs text-zinc-500">
                  <div className="space-y-1">
                    <p className="flex items-center gap-1.5">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      {member.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MailIcon className="h-3.5 w-3.5" />
                      {member.email}
                    </p>
                  </div>
                  <span className="text-forest-700">
                    <LinkedInIcon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
