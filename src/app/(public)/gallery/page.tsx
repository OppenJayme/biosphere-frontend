import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { COLLECTIONS } from "@/lib/collections-data";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { stagger } from "@/lib/stagger";
import { ArrowRightIcon, LeafIcon, ShieldIcon, SparkleIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Explore the USC Biological Museum's exhibit areas: Entomology, Herpetology, and Marine Biology.",
};

const WHY_VISIT = [
  {
    icon: LeafIcon,
    title: "Philippine biodiversity",
    description: "A deeper appreciation of the rich life and ecosystems we share.",
  },
  {
    icon: ShieldIcon,
    title: "Curated collection",
    description: "Carefully preserved specimens and artifacts you won't see elsewhere.",
  },
  {
    icon: SparkleIcon,
    title: "Immersive learning",
    description: "Engaging displays that bring specimens to life using augmented reality.",
  },
];

type Collection = (typeof COLLECTIONS)[number];

export default function GalleryPage() {
  return (
    <>
      <section className="mx-auto max-w-[1240px] px-5 pt-12 sm:px-8 lg:pt-20">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h1 className="rise font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink sm:text-6xl lg:col-span-7">
            Explore our exhibits
          </h1>
          <div className="lg:col-span-5">
            <p className="rise text-lg leading-relaxed text-ink-muted" style={stagger(1)}>
              Three exhibit areas trace the richness of life in the Philippines.
              There&apos;s even more to discover in person.
            </p>
            <div className="rise mt-7 flex flex-wrap gap-3" style={stagger(2)}>
              <Button href="#entomology">
                View exhibit areas
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
              <Button href="/visit" variant="outline-forest">
                Plan a visit
              </Button>
            </div>
          </div>
        </div>

        <div
          className="rise relative mt-12 aspect-4/3 overflow-hidden rounded-2xl sm:aspect-21/9"
          style={stagger(3)}
        >
          <Image
            src={PLACEHOLDER_IMAGES.heroGallery}
            alt="A natural history museum hall with a whale skeleton suspended overhead"
            fill
            priority
            sizes="(min-width: 1240px) 1176px, 100vw"
            className="object-cover object-[center_40%]"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12">
        {/* Sticky index: jump between exhibit areas without a zigzag of image rows. */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              Exhibit areas
            </h2>
            <nav aria-label="Exhibit areas" className="mt-6">
              <ul className="border-t border-line">
                {COLLECTIONS.map((collection) => (
                  <li key={collection.slug} className="border-b border-line">
                    <a
                      href={`#${collection.slug}`}
                      className="group flex items-center gap-4 py-4 transition-colors hover:text-brand"
                    >
                      <Image src={collection.mark} alt="" aria-hidden className="h-9 w-9 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-lg font-semibold text-ink group-hover:text-brand">
                          {collection.name}
                        </span>
                        <span className="block font-mono text-[11px] text-ink-muted">
                          {collection.taxon}
                        </span>
                      </span>
                      <ArrowRightIcon className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <div className="space-y-24 lg:col-span-8">
          {COLLECTIONS.map((collection, index) => (
            <ExhibitArea key={collection.slug} collection={collection} priority={index === 0} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8">
        <h2 className="reveal max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-ink sm:text-5xl">
          What makes our exhibits worth visiting
        </h2>
        <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-8">
          {WHY_VISIT.map((item) => (
            <div key={item.title} className="reveal">
              <item.icon className="h-6 w-6 text-accent" />
              <p className="mt-4 font-display text-xl font-semibold text-ink">{item.title}</p>
              <p className="mt-2 max-w-xs text-ink-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="reveal flex flex-col items-start gap-8 rounded-2xl bg-brand-soft px-7 py-12 sm:px-12 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              See it all in person
            </h2>
            <p className="mt-3 max-w-md text-ink-muted">
              Our exhibits are best experienced up close. Plan your visit and
              discover more beyond what photos can show.
            </p>
          </div>
          <Button href="/visit">
            Plan a visit
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}

function ExhibitArea({ collection, priority }: { collection: Collection; priority: boolean }) {
  return (
    <article id={collection.slug} className="scroll-mt-28">
      <div className="reveal relative aspect-16/10 overflow-hidden rounded-2xl">
        <Image
          src={collection.imageWide}
          alt={collection.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 66vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="reveal mt-8 flex items-center gap-4">
        <Image src={collection.mark} alt="" aria-hidden className="h-12 w-12 shrink-0" />
        <div>
          <p className="font-mono text-xs text-ink-muted">{collection.taxon}</p>
          <h3 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {collection.name}
          </h3>
        </div>
      </div>

      <p className="reveal mt-5 max-w-[62ch] text-lg leading-relaxed text-ink-muted">
        {collection.description}
      </p>

      <ul className="reveal mt-8 grid gap-4 sm:grid-cols-3">
        {collection.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
            <Image src={collection.mark} alt="" aria-hidden className="h-7 w-7 shrink-0" />
            <span className="text-sm text-ink">{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
