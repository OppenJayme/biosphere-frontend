import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { COLLECTIONS } from "@/lib/collections-data";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { ArrowRightIcon } from "@/components/icons";
import { stagger } from "@/lib/stagger";

const WAYS_TO_CONNECT = [
  {
    title: "Schedule a museum visit",
    description: "Plan a guided visit for your class, organization, or group.",
    href: "/visit",
  },
  {
    title: "Take a guided tour",
    description: "Join a curator-led walkthrough of our featured exhibits.",
    href: "/gallery",
  },
  {
    title: "Meet the curator",
    description: "Schedule a consultation for research, collection, or collaboration.",
    href: "/about#curatorial-team",
  },
];

const SCIENCE_POINTS = [
  { label: "Research", description: "Advancing scientific discovery and knowledge." },
  { label: "Education", description: "Inspiring learners through hands-on experiences." },
  {
    label: "Conservation",
    description: "Championing the protection of biodiversity for future generations.",
  },
];

type Collection = (typeof COLLECTIONS)[number];

// Bento placement for the three collections: one tall feature tile, two stacked.
const TILE_LAYOUT: Record<Collection["slug"], string> = {
  entomology: "lg:col-span-7 lg:row-span-2",
  herpetology: "lg:col-span-5",
  "marine-biology": "lg:col-span-5",
};

export default function HomePage() {
  return (
    <>
      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 pt-10 pb-20 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-12 lg:pt-16 lg:pb-28">
        <div className="lg:col-span-7">
          <p className="rise font-mono text-xs tracking-wide text-brand">
            University of San Carlos, Cebu
          </p>
          <h1
            className="rise mt-5 font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink lg:text-[3.6rem]"
            style={stagger(1)}
          >
            Philippine life, preserved since 1952.
          </h1>
          <p
            className="rise mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-muted"
            style={stagger(2)}
          >
            Explore the specimens behind decades of teaching and research at the
            USC Biological Museum, then come see them up close.
          </p>
          <div className="rise mt-9 flex flex-wrap gap-3" style={stagger(3)}>
            <Button href="/gallery">
              Explore the gallery
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button href="/visit" variant="outline-forest">
              Plan a visit
            </Button>
          </div>
        </div>

        <div className="rise relative lg:col-span-5" style={stagger(2)}>
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl lg:aspect-5/4">
            <Image
              src={PLACEHOLDER_IMAGES.heroHome}
              alt="Mist rising over a tropical rainforest canopy"
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
        <h2 className="reveal max-w-2xl font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          Explore our collections
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-12 lg:grid-rows-2">
          {COLLECTIONS.map((collection) => (
            <CollectionTile
              key={collection.slug}
              collection={collection}
              className={TILE_LAYOUT[collection.slug]}
              featured={collection.slug === "entomology"}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-12 lg:items-center">
        <div className="reveal relative aspect-4/5 overflow-hidden rounded-2xl sm:aspect-4/3 lg:col-span-5 lg:aspect-4/5">
          <Image
            src={PLACEHOLDER_IMAGES.homeScience}
            alt="A pressed plant specimen from a herbarium collection"
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
            Science in service of society
          </h2>
          <p className="reveal mt-5 max-w-[58ch] text-lg leading-relaxed text-ink-muted">
            The USC Biological Museum supports teaching, research, and public
            engagement by preserving biological collections and promoting
            biodiversity awareness and conservation.
          </p>

          <dl className="mt-10 border-t border-line">
            {SCIENCE_POINTS.map((point) => (
              <div
                key={point.label}
                className="reveal grid gap-1 border-b border-line py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"
              >
                <dt className="font-display text-lg font-semibold text-ink">{point.label}</dt>
                <dd className="text-ink-muted">{point.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
        <h2 className="reveal font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Ways to connect with the museum
        </h2>

        <ul className="mt-10 border-t border-line">
          {WAYS_TO_CONNECT.map((way) => (
            <li key={way.title} className="reveal border-b border-line">
              <Link
                href={way.href}
                className="group grid items-center gap-2 py-7 transition-colors sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] sm:gap-8 sm:px-4 sm:hover:bg-brand-soft"
              >
                <span className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {way.title}
                </span>
                <span className="text-ink-muted">{way.description}</span>
                <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-line text-brand transition-transform duration-300 group-hover:translate-x-1 sm:flex">
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal flex flex-col items-start gap-8 rounded-2xl bg-brand-soft px-7 py-12 sm:px-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Have a question?
            </h2>
            <p className="mt-3 max-w-md text-ink-muted">
              Send us a general inquiry and a curator will get back to you.
            </p>
          </div>
          <Button href="/inquiry">
            Send an inquiry
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}

function CollectionTile({
  collection,
  className,
  featured,
}: {
  collection: Collection;
  className: string;
  featured: boolean;
}) {
  return (
    <Link
      href={`/gallery#${collection.slug}`}
      className={`reveal group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl ${
        featured ? "lg:min-h-[36rem]" : ""
      } ${className}`}
    >
      <Image
        src={collection.image}
        alt=""
        fill
        sizes={featured ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
      {/* Scrim keeps the caption legible over any photo. */}
      <div className="absolute inset-0 bg-linear-to-t from-forest-900/90 via-forest-900/35 to-transparent" />

      <div className="relative flex items-end gap-4 p-6 sm:p-8">
        <Image
          src={collection.badge}
          alt=""
          aria-hidden
          className={`shrink-0 rounded-full border-2 border-white/90 ${featured ? "h-16 w-16" : "h-12 w-12"}`}
        />
        <div className="min-w-0 flex-1 text-white">
          <p className="font-mono text-[11px] tracking-wide text-white/70">{collection.taxon}</p>
          <h3
            className={`mt-1 font-display font-semibold tracking-tight ${
              featured ? "text-3xl sm:text-4xl" : "text-2xl"
            }`}
          >
            {collection.name}
          </h3>
          <p className={`mt-2 max-w-md text-sm text-white/80 ${featured ? "" : "line-clamp-2"}`}>
            {collection.shortDescription}
          </p>
        </div>
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-1 sm:flex">
          <ArrowRightIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
