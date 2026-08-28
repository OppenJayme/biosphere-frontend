import Image from "next/image";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  description?: string;
};

export function PageHero({
  title,
  description,
  note,
  actions,
  features,
}: {
  title: string;
  description: string;
  note?: ReactNode;
  actions?: ReactNode;
  features?: Feature[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-black/10">
      <Image
        src={PLACEHOLDER_IMAGES.heroBackground}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_65%]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/25" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-xl">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-forest-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-zinc-700">{description}</p>
          {note && <div className="mt-3 text-sm text-zinc-600">{note}</div>}
          {actions && <div className="mt-8 flex flex-wrap gap-4">{actions}</div>}
        </div>

        {features && (
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.label}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-forest-700/40 text-forest-700">
                  <feature.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-semibold text-forest-900">{feature.label}</p>
                {feature.description && (
                  <p className="mt-1 text-xs text-zinc-600">{feature.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
