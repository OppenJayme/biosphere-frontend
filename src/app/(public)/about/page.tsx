import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { stagger } from "@/lib/stagger";
import { ArrowRightIcon, MailIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "The mission and history of the University of San Carlos Biological Museum.",
};

const HISTORY = [
  {
    year: "1952",
    text: (
      <>
        Founded by the German priest and entomologist{" "}
        <strong className="font-semibold text-ink">Enrique Schoenig</strong>.
      </>
    ),
  },
  {
    year: "1967",
    text: <>Formally inaugurated as part of the University of San Carlos on April 23, 1967.</>,
  },
  {
    year: "Today",
    text: <>Its collections are maintained in collaboration with the university&apos;s Department of Biology.</>,
  },
];

const PURPOSE = [
  {
    title: "Mission",
    description:
      "Preserve and document biological collections to advance learning, research, and the understanding of life's diversity.",
  },
  {
    title: "Education",
    description:
      "Inspire learners of all ages through engaging exhibits, guided tours, and hands-on experiences.",
  },
  {
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

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("");
}

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 pt-12 pb-24 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-14 lg:pt-20">
        <div className="rise relative aspect-4/3 overflow-hidden rounded-2xl lg:col-span-5 lg:aspect-4/5">
          <Image
            src={PLACEHOLDER_IMAGES.heroAbout}
            alt="A researcher studying a sample through a microscope"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="lg:col-span-7">
          <p className="rise font-mono text-xs tracking-wide text-brand" style={stagger(1)}>
            Est. 1952
          </p>
          <h1
            className="rise mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink sm:text-6xl"
            style={stagger(2)}
          >
            About the USC Biological Museum
          </h1>
          <p className="rise mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted" style={stagger(3)}>
            We preserve the rich biodiversity of the Philippines through curated
            collections, research, education, and public engagement.
          </p>
          <div className="rise mt-9" style={stagger(4)}>
            <Button href="/gallery">
              Explore the gallery
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-14 px-5 pb-24 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Our history
          </h2>
          <ol className="relative mt-10 space-y-10 border-l border-line pl-8 sm:pl-10">
            {HISTORY.map((entry) => (
              <li key={entry.year} className="reveal relative">
                <span
                  aria-hidden
                  className="absolute top-3 -left-[calc(2rem+4.5px)] h-2 w-2 rounded-full bg-accent sm:-left-[calc(2.5rem+4.5px)]"
                />
                <p className="font-display text-4xl font-semibold tracking-tight text-brand sm:text-5xl">
                  {entry.year}
                </p>
                <p className="mt-3 max-w-[48ch] text-lg leading-relaxed text-ink-muted">{entry.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <figure className="reveal lg:col-span-5 lg:pt-24">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
            <Image
              src={PLACEHOLDER_IMAGES.aboutHistory}
              alt="A preserved beetle collection"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-6">
            <p className="font-display text-xl font-semibold text-ink">Through the years</p>
            <p className="mt-2 text-ink-muted">
              Our collections have grown through donations, fieldwork, and
              research partnerships, preserving specimens that tell the story of
              Philippine biodiversity.
            </p>
            <Link
              href="/gallery"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
            >
              Learn more about the collection
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </figcaption>
        </figure>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
        <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          What we stand for
        </h2>
        <dl className="mt-10 border-t border-line">
          {PURPOSE.map((item) => (
            <div
              key={item.title}
              className="reveal grid gap-2 border-b border-line py-8 md:grid-cols-12 md:gap-8"
            >
              <dt className="font-display text-2xl font-semibold tracking-tight text-ink md:col-span-4">
                {item.title}
              </dt>
              <dd className="max-w-[60ch] text-lg leading-relaxed text-ink-muted md:col-span-8">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="curatorial-team" className="mx-auto max-w-[1240px] scroll-mt-24 px-5 sm:px-8">
        <div className="rounded-2xl bg-brand-soft px-7 py-12 sm:px-12">
          <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-ink">
            Curatorial team
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CURATORIAL_TEAM.map((member) => (
              <li key={member.name} className="reveal rounded-2xl bg-surface p-7">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-solid font-display text-lg font-semibold text-white">
                    {initials(member.name)}
                  </span>
                  <div>
                    <p className="font-display text-xl font-semibold text-ink">{member.name}</p>
                    <p className="font-mono text-xs text-ink-muted">{member.role}</p>
                  </div>
                </div>
                <p className="mt-5 text-ink-muted">{member.description}</p>
                <a
                  href={`mailto:${member.email}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                >
                  <MailIcon className="h-4 w-4" />
                  {member.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
