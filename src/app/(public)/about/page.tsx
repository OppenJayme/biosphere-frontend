import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { stagger } from "@/lib/stagger";
import { ArrowRightIcon, MailIcon, PhoneIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "The mission and history of the University of San Carlos Biological Museum.",
};

// Dates follow the USC Department of Biology and Museums pages (checked 2026-11-22). 1952 is
// the department's founding and the start of collecting; 1967 is the USC Museum's inauguration.
const HISTORY = [
  {
    year: "1952",
    text: (
      <>
        The Department of Biology was founded, and the university began building the collections
        that would later fill the USC Museum.
      </>
    ),
  },
  {
    year: "1967",
    text: (
      <>
        The University of San Carlos Museum was formally inaugurated on April 23, with biodiversity
        as one of its three original galleries.
      </>
    ),
  },
  {
    year: "Today",
    text: (
      <>
        The Department of Biology maintains the Entomological and Marine Biology Collections, each
        with its own curator, in collaboration with the USC Museum.
      </>
    ),
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

// Titles, degrees and research interests follow each curator's USC profile (2026-11-22).
// Phone numbers were supplied by the museum (2026-11-07). The landline is the USC trunk line
// plus local 122; the comma in its tel: link makes phones pause before dialing the local.
const CURATORIAL_TEAM = [
  {
    name: "Fidel E. Bendanillo, MSc",
    initials: "FB",
    role: "Curator, Entomological Collection",
    degrees: [
      { title: "B.S. Agriculture-Entomology", school: "Central Mindanao University", year: 1992 },
      { title: "M.S. Biology", school: "University of San Carlos", year: 2013 },
    ],
    researchInterests:
      "Insect taxonomy, insect ecology, forest entomology, post-harvest entomology, medical entomology",
    email: "febendanillo@usc.edu.ph",
    phones: [
      { label: "032-230-0100-122", href: "tel:+63322300100,122" },
      { label: "+63 956 689 2497", href: "tel:+639566892497" },
    ],
  },
  {
    name: "Dave Anthony P. Valles",
    initials: "DV",
    role: "Curator, Marine Collection",
    degrees: [{ title: "B.S. Marine Biology", school: "University of San Carlos", year: 1992 }],
    researchInterests:
      "Marine biodiversity, reef assessment and monitoring, molluscan and scleractinian coral taxonomy",
    email: null, // left off the public site for now (Marq, 2026-11-22)
    phones: [],
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 pt-12 pb-24 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-14 lg:pt-20">
        <div className="rise relative aspect-4/3 overflow-hidden rounded-2xl lg:col-span-5 lg:aspect-4/5">
          <Image
            src={PLACEHOLDER_IMAGES.heroAbout}
            alt="Portrait of Enrique Schoenig"
            fill
            priority
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="lg:col-span-7">
          <p className="rise font-mono text-xs tracking-wide text-brand" style={stagger(1)}>
            Collecting since 1952
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

      {/* Sources: the USC Department of Biology (Overview) and Museums pages on usc.edu.ph,
          and the museum's plaque quoting The Philippine Scientist 19 (1982): 1-2. "German priest
          and entomologist" comes from this site's earlier copy, kept at Marq's request. */}
      <section
        id="overview"
        aria-labelledby="overview-heading"
        className="mx-auto grid max-w-[1240px] scroll-mt-24 gap-10 px-5 pb-24 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-14"
      >
        <div className="lg:col-span-7">
          <h2
            id="overview-heading"
            className="reveal font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
          >
            Overview
          </h2>
          <p className="reveal mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            Our biological collection grew up with the university&apos;s Department of Biology,
            established in 1952. In the department&apos;s early years,{" "}
            <strong className="font-semibold text-ink">Fr. Enrique (Heinrich) Schoenig, SVD</strong>,
            a German priest and entomologist, led many expeditions into the field, and the plants
            and animals gathered on them became a substantial collection.
          </p>
          <p className="reveal mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-muted">
            Visitors can still see that legacy in the USC Museum&apos;s Biological Collection. Today
            the museum works with the Department of Biology, which cares for the Entomological and
            Marine Biology Collections.
          </p>
        </div>

        <figure className="reveal rounded-2xl bg-brand-soft p-7 sm:p-10 lg:col-span-5">
          <p className="font-mono text-xs tracking-wide text-brand">Remembering Fr. Schoenig</p>
          <blockquote className="mt-4 font-display text-2xl leading-snug font-semibold text-balance text-ink sm:text-3xl">
            <p>&ldquo;A model of patience, industry, efficiency, dedication and faith in God&rdquo;</p>
          </blockquote>
          <figcaption className="mt-6 leading-relaxed text-ink-muted">
            <p>
              Fr. Josef Baumgartner paid this tribute to Fr. Schoenig, describing a singular person
              who made God&apos;s love for humanity visible by revealing nature&apos;s mystery and
              beauty through science.
            </p>
            <p className="mt-4 text-sm">
              <cite>The Philippine Scientist</cite>, Vol. 19 (1982): 1&ndash;2
            </p>
          </figcaption>
        </figure>
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
              alt="Wooden display cabinets of preserved specimens at the USC Biological Museum"
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
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {CURATORIAL_TEAM.map((member) => (
              <li key={member.name} className="reveal flex flex-col rounded-2xl bg-surface p-7">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-solid font-display text-lg font-semibold text-white">
                    {member.initials}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{member.name}</h3>
                    <p className="font-mono text-xs text-ink-muted">{member.role}</p>
                  </div>
                </div>
                <dl className="mt-6 mb-6 space-y-5 text-sm leading-relaxed last:mb-0">
                  <div>
                    <dt className="font-semibold text-ink">
                      {member.degrees.length === 1 ? "Degree" : "Degrees"}
                    </dt>
                    {member.degrees.map((degree) => (
                      <dd key={degree.title} className="mt-1.5 text-ink-muted">
                        <span className="block text-ink">{degree.title}</span>
                        {degree.school}, {degree.year}
                      </dd>
                    ))}
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Research interests</dt>
                    <dd className="mt-1.5 text-ink-muted">{member.researchInterests}</dd>
                  </div>
                </dl>
                {(member.email || member.phones.length > 0) && (
                  <ul className="mt-auto space-y-2 border-t border-line pt-5">
                    {member.phones.map((phone) => (
                      <li key={phone.href}>
                        <a
                          href={phone.href}
                          className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          {phone.label}
                        </a>
                      </li>
                    ))}
                    {member.email && (
                      <li>
                        <a
                          href={`mailto:${member.email}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                        >
                          <MailIcon className="h-4 w-4 shrink-0" />
                          {/* A long address wraps before the @, and mid-word only as a last resort. */}
                          <span className="min-w-0 wrap-anywhere">
                            {member.email.split("@")[0]}
                            <wbr />@{member.email.split("@")[1]}
                          </span>
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="about-biosphere"
        aria-labelledby="about-biosphere-heading"
        className="mx-auto grid max-w-[1240px] scroll-mt-24 gap-5 px-5 pt-24 sm:px-8 md:grid-cols-12 md:gap-8"
      >
        <h2
          id="about-biosphere-heading"
          className="reveal font-display text-3xl font-semibold tracking-tight text-ink md:col-span-4"
        >
          About BioSphere
        </h2>
        <p className="reveal max-w-[60ch] text-lg leading-relaxed text-ink-muted md:col-span-8">
          BioSphere is the museum&apos;s digital home. Curators use it to catalog specimens, track
          where they are kept, and answer visit requests and inquiries. Visitors explore the
          collection in person at the museum, where the gallery&apos;s QR-linked exhibits open more
          about each display, and can ask the museum assistant here anytime. It was built as a
          capstone project at the University of San Carlos.
        </p>
      </section>
    </>
  );
}
