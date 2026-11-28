import Image from "next/image";
import { LogoMark } from "@/components/layout/LogoMark";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

/**
 * Left half of the sign-in pages on large screens: the BioSphere name, logo and museum over the
 * reef photo. Panel feedback found the old version's text hard to read over the photo and its
 * feature cards unnecessary, so the photo is softened (light blur, then the Home hero's dark green
 * scrims) and only the brand remains. Decorative, so phones skip it.
 */
export function AuthShowcase() {
  return (
    <div className="relative isolate hidden overflow-hidden bg-forest-900 lg:flex lg:items-center lg:justify-center">
      {/* scale-110 keeps the blurred edges outside the frame; hero-still is the Home hero's slow zoom. */}
      <div className="hero-still absolute inset-0 -z-10">
        <Image
          src={PLACEHOLDER_IMAGES.authShowcase}
          alt=""
          fill
          priority
          sizes="50vw"
          className="scale-110 object-cover blur-[3px]"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-forest-900/55" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgb(20_42_31/0.35),rgb(20_42_31/0.85)_75%)]"
      />

      <div className="flex flex-col items-center px-12 text-center">
        <p className="font-serif text-4xl font-semibold tracking-tight text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)] xl:text-5xl">
          BioSphere
        </p>
        <LogoMark className="mt-8 h-40 w-40 drop-shadow-[0_12px_32px_rgb(0_0_0/0.4)] xl:h-48 xl:w-48" />
        <p className="mt-8 text-lg font-medium tracking-wide text-gold-500 drop-shadow-[0_2px_8px_rgb(0_0_0/0.4)]">
          USC Biological Museum
        </p>
      </div>
    </div>
  );
}
