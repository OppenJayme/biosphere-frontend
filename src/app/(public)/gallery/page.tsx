import type { Metadata } from "next";
import Image from "next/image";
import type { ComponentType, SVGProps } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/Button";
import { COLLECTIONS } from "@/lib/collections-data";
import {
  ArrowRightIcon,
  CalendarIcon,
  InfoIcon,
  LeafIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore the USC Biological Museum's exhibit areas — Entomology, Herpetology, and Marine Biology.",
};

const WHY_VISIT = [
  {
    icon: LeafIcon,
    title: "Philippine Biodiversity",
    description: "A deeper appreciation of the rich life and ecosystems we share.",
  },
  {
    icon: ShieldIcon,
    title: "Curated Collection",
    description: "Carefully preserved specimens and artifacts you won't see elsewhere.",
  },
  {
    icon: SparkleIcon,
    title: "Immersive Learning",
    description: "Engaging displays that breathe life into the world using augmented reality.",
  },
];

export default function GalleryPage() {
  return (
    <>
      <PageHero
        title="Explore Our Exhibits"
        description="Step into a world of wonder. Our exhibits showcase the richness of life in the Philippines through carefully curated stories and discoveries."
        note={
          <span className="inline-flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-gold-600" />
            There&apos;s more to discover in person.
          </span>
        }
        actions={
          <>
            <Button href="#entomology">
              View Exhibit Areas
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Button href="/visit" variant="outline-forest">
              <CalendarIcon className="h-4 w-4" />
              Request a Visit
            </Button>
          </>
        }
      />

      <section className="mx-auto max-w-6xl space-y-16 px-6 py-16">
        {COLLECTIONS.map((collection, index) => (
          <ExhibitArea key={collection.slug} collection={collection} reversed={index % 2 === 1} />
        ))}
      </section>

      <section className="border-t border-black/10 bg-sage-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">
            Why Visit Our Exhibits
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-forest-900">
            What Makes Our Exhibits Worth Visiting
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {WHY_VISIT.map((item) => (
              <div key={item.title}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-forest-700/30 text-forest-700">
                  <item.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-serif text-lg font-semibold text-forest-900">
                  {item.title}
                </p>
                <p className="mt-1.5 text-sm text-zinc-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-sage-100 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-forest-700/30 text-forest-700">
              <SparkleIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold text-forest-900">
                See It All in Person
              </h2>
              <p className="mt-1 max-w-md text-zinc-600">
                Our exhibits are best experienced up close. Plan your visit and
                discover more beyond what photos can show.
              </p>
            </div>
          </div>
          <Button href="/visit" className="shrink-0">
            Plan Your Visit Today
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}

type Collection = (typeof COLLECTIONS)[number];

function ExhibitArea({ collection, reversed }: { collection: Collection; reversed: boolean }) {
  const Icon = collection.icon as ComponentType<SVGProps<SVGSVGElement>>;
  const image = collection.imageWide ?? collection.image;

  return (
    <div
      id={collection.slug}
      className={`grid scroll-mt-24 gap-8 lg:grid-cols-2 lg:items-center ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">
          Featured Area
        </p>
        <h3 className="mt-2 font-serif text-3xl font-semibold text-forest-900">
          {collection.name}
        </h3>
        <p className="mt-4 text-zinc-700">{collection.description}</p>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-4">
          {collection.features.map((feature) => (
            <li key={feature} className="flex max-w-[10rem] items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              <span className="text-xs text-zinc-600">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative aspect-16/10 overflow-hidden rounded-2xl">
        {image ? (
          <Image
            src={image}
            alt={collection.name}
            fill
            sizes="(min-width: 1024px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-forest-600 to-forest-900">
            <Icon className="h-16 w-16 text-white/80" />
          </div>
        )}
      </div>
    </div>
  );
}
