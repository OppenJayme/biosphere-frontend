import { LogoMark } from "@/components/layout/LogoMark";

/**
 * Left half of the sign-in pages on large screens: the BioSphere name, logo and museum on dark
 * green, and nothing else. Panel feedback found the old photo background made its text hard to
 * read and its feature cards unnecessary on a sign-in screen. Decorative, so phones skip it.
 */
export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:items-center lg:justify-center">
      {/* A soft lighter centre keeps the flat green from looking like an empty panel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(44_92_66/0.55),transparent_65%)]"
      />
      <div className="relative flex flex-col items-center px-12 text-center">
        <p className="font-serif text-4xl font-semibold tracking-tight text-white xl:text-5xl">BioSphere</p>
        <LogoMark className="mt-8 h-40 w-40 drop-shadow-[0_12px_32px_rgb(0_0_0/0.35)] xl:h-48 xl:w-48" />
        <p className="mt-8 text-lg font-medium tracking-wide text-gold-500">USC Biological Museum</p>
      </div>
    </div>
  );
}
