import Link from "next/link";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/Button";
import { COLLECTIONS } from "@/lib/collections-data";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import {
  CalendarIcon,
  CompassIcon,
  UserIcon,
  ArrowRightIcon,
  BookOpenIcon,
  SparkleIcon,
  LeafIcon,
} from "@/components/icons";

const INFO_CARDS = [
  {
    icon: CalendarIcon,
    title: "Schedule a Museum Visit",
    description: "Plan a guided visit for your class, organization, or group.",
    href: "/visit",
  },
  {
    icon: CompassIcon,
    title: "Take a Guided Tour",
    description: "Join a curator-led walkthrough of our featured exhibits.",
    href: "/gallery",
  },
  {
    icon: UserIcon,
    title: "Meet the Curator",
    description: "Schedule a consultation for research, collection, or collaboration.",
    href: "/about#curatorial-team",
  },
];

const SCIENCE_POINTS = [
  { icon: SparkleIcon, label: "Research", description: "Advancing scientific discovery and knowledge." },
  { icon: BookOpenIcon, label: "Education", description: "Inspiring learners through hands-on experiences." },
  { icon: LeafIcon, label: "Conservation", description: "Championing the protection of biodiversity for future generations." },
];

export default function HomePage() {
  return (
    <>
      <PageHero
        title="Discover Life at the USC Biological Museum"
        description="Preserving the rich biodiversity of the Philippines through research, education, and public engagement."
        actions={
          <>
            <Button href="/gallery">
              Explore Exhibits
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button href="/visit" variant="outline-forest">
              <CalendarIcon className="h-4 w-4" />
              Request a Visit
            </Button>
          </>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {INFO_CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-2xl border border-black/10 p-6 transition-colors hover:border-forest-700 hover:bg-sage-50"
            >
              <card.icon className="h-7 w-7 text-forest-700" />
              <p className="mt-4 font-serif text-lg font-semibold text-forest-900">
                {card.title}
              </p>
              <p className="mt-1.5 text-sm text-zinc-600">{card.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-forest-700">
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">
          Featured Exhibit
        </p>
        <h2 className="mt-2 font-serif text-3xl font-semibold text-forest-900">
          Explore Our Collections
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {COLLECTIONS.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-10 rounded-3xl bg-sage-100 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">
              About the Museum
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-forest-900">
              Science in Service of Society
            </h2>
            <p className="mt-4 text-zinc-700">
              The USC Biological Museum supports teaching, research, and public
              engagement by preserving biological collections and promoting
              biodiversity awareness and conservation.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {SCIENCE_POINTS.map((point) => (
                <div key={point.label}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-forest-700">
                    <point.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-2 text-sm font-semibold text-forest-900">{point.label}</p>
                  <p className="mt-1 text-xs text-zinc-600">{point.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
            <Image
              src={PLACEHOLDER_IMAGES.marineReefWide}
              alt="Marine ecosystem on display at the museum"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 bg-sage-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-forest-900">
              Have a question?
            </h2>
            <p className="mt-2 max-w-md text-zinc-600">
              Send us a general inquiry and a curator will get back to you.
            </p>
          </div>
          <Button href="/inquiry" variant="solid-gold">
            Send an Inquiry
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}

type Collection = (typeof COLLECTIONS)[number];

function CollectionCard({ collection }: { collection: Collection }) {
  const Icon = collection.icon as ComponentType<SVGProps<SVGSVGElement>>;

  return (
    <Link href={`/gallery#${collection.slug}`} className="group block">
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-forest-700">
        {collection.image ? (
          <Image
            src={collection.image}
            alt={collection.name}
            fill
            sizes="(min-width: 640px) 33vw, 90vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-forest-600 to-forest-900">
            <Icon className="h-12 w-12 text-white/80" />
          </div>
        )}
      </div>

      <div className="relative -mt-6 ml-6 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-forest-700 text-white shadow-sm">
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-3 font-serif text-lg font-semibold text-forest-900 group-hover:text-forest-700">
        {collection.name}
      </h3>
      <p className="mt-1.5 text-sm text-zinc-600">{collection.shortDescription}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-forest-700">
        Learn More
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
