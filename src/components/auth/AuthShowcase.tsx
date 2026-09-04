import Image from "next/image";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import { PanelIcon } from "@/components/icons";

const FEATURES = [
  "Specimen Records",
  "Cataloging Window",
  "Storage Tracking",
  "QR & Public Info",
];

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <Image
        src={PLACEHOLDER_IMAGES.heroBackground}
        alt=""
        fill
        priority
        sizes="50vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/25 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
        <div>
          <p className="font-serif text-2xl font-semibold text-forest-800">BioSphere Inventory</p>
          <p className="mt-0.5 text-sm text-zinc-600">USC Biological Museum</p>
        </div>

        <div className="max-w-md">
          <h1 className="font-serif text-4xl font-semibold leading-[1.15] text-forest-800 xl:text-[2.75rem]">
            Smarter specimen management, simplified.
          </h1>
          <p className="mt-4 text-zinc-700">
            Manage biological museum specimens, cataloging, storage locations, and curator
            workflows in one streamlined system.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((label) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-3 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white">
                <PanelIcon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-forest-900">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
