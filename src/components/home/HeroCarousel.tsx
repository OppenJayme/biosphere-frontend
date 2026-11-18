"use client";

// Auto-advancing, crossfading photo carousel for public-page heroes (Embla + Fade +
// Autoplay). Two looks share one behavior:
//  - "framed": a rounded photo panel that sits beside page copy (Home hero).
//  - "cinematic": a full-bleed, dark slide with an oversized title per slide (Gallery hero).
// Accessibility invariants: autoplay never starts under prefers-reduced-motion, a
// visible pause/play control is always present (WCAG 2.2.2), hovering or focusing
// the carousel pauses it, and slides are announced only while it is paused.
// Only the first slide's image is `priority`, so the carousel does not slow LCP.

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from "@/components/icons";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
// The server snapshot says "reduced", so the slideshow only starts after hydration.
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

export type HeroSlide = {
  image: StaticImageData | string;
  alt: string;
  /** CSS object-position for the crop, e.g. "center 40%". */
  focus?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
};

type HeroCarouselProps = {
  slides: readonly HeroSlide[];
  label: string;
  variant?: "framed" | "cinematic";
  /** Milliseconds each slide stays before advancing. */
  delay?: number;
  /** Passed to next/image; describe the rendered width at each breakpoint. */
  sizes: string;
  className?: string;
};

export function HeroCarousel({
  slides,
  label,
  variant = "framed",
  delay = 6500,
  sizes,
  className = "",
}: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 32 }, [
    Fade(),
    // The plugin's own hover/focus pausing restarts on mouseleave/focusout even after the
    // user pressed Pause, so this component owns pausing: the plugin only runs the timer.
    Autoplay({ delay, playOnInit: false, stopOnInteraction: true, stopOnMouseEnter: false, stopOnFocusIn: false }),
  ]);
  const [selected, setSelected] = useState(0);
  // `playing` is the user's choice (pause button, off under reduced motion). `hovered`
  // and `focused` hold it temporarily. `timerKey` restarts the progress bar each time
  // the autoplay timer is armed; `timerRunning` shows a full bar while it is held.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = userPlaying ?? !reducedMotion;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const running = playing && !hovered && !focused;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onTimerSet = () => {
      setTimerRunning(true);
      setTimerKey((key) => key + 1);
    };
    const onTimerStopped = () => setTimerRunning(false);

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("autoplay:timerset", onTimerSet);
    emblaApi.on("autoplay:timerstopped", onTimerStopped);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("autoplay:timerset", onTimerSet);
      emblaApi.off("autoplay:timerstopped", onTimerStopped);
    };
  }, [emblaApi]);

  // Single place that starts/stops the timer. A swipe stops the plugin (stopOnInteraction),
  // so resume after the pointer lifts if nothing else is holding the carousel.
  useEffect(() => {
    if (!emblaApi) return;
    const autoplay = emblaApi.plugins().autoplay;
    if (running) autoplay.play();
    else autoplay.stop();
    const onPointerUp = () => {
      if (running) autoplay.play();
    };
    emblaApi.on("pointerUp", onPointerUp);
    return () => {
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, running]);

  const togglePlaying = useCallback(() => setUserPlaying(!playing), [playing]);

  const goTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
      emblaApi?.plugins().autoplay.reset();
    },
    [emblaApi],
  );
  const goPrev = useCallback(() => goTo((selected - 1 + slides.length) % slides.length), [goTo, selected, slides.length]);
  const goNext = useCallback(() => goTo((selected + 1) % slides.length), [goTo, selected, slides.length]);

  const cinematic = variant === "cinematic";
  const progressStyle = { "--hero-delay": `${delay}ms` } as CSSProperties;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      className={`hero-carousel relative isolate overflow-hidden ${
        cinematic ? "h-[min(86svh,52rem)] min-h-[34rem] bg-forest-900" : "aspect-4/5 rounded-2xl bg-forest-900 sm:aspect-4/3 lg:aspect-4/5"
      } ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Only keyboard focus holds the slideshow; a mouse click on Play must start it.
      onFocus={(event) => {
        if (event.target.matches(":focus-visible")) setFocused(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goPrev();
        if (event.key === "ArrowRight") goNext();
      }}
    >
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full touch-pan-y" aria-live={running ? "off" : "polite"}>
          {slides.map((slide, index) => {
            const active = index === selected;
            return (
              <div
                key={slide.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
                aria-hidden={!active}
                inert={!active}
                className={`relative h-full min-w-0 flex-[0_0_100%] ${active ? "is-active" : ""}`}
              >
                <div className="hero-media absolute inset-0">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    priority={index === 0}
                    sizes={sizes}
                    className="object-cover"
                    style={{ objectPosition: slide.focus ?? "center" }}
                  />
                </div>

                {cinematic ? (
                  <CinematicCaption slide={slide} index={index} total={slides.length} />
                ) : (
                  <FramedCaption slide={slide} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls: progress dots, prev/next and pause. Cinematic keeps them bottom-left,
          aligned with the copy, so the floating FAQ button never covers them. */}
      <div
        className={`absolute bottom-0 z-10 flex items-center gap-2 ${
          cinematic
            ? "inset-x-0 mx-auto max-w-[1240px] px-5 pb-8 sm:px-8 sm:pb-10"
            : "right-0 p-4 sm:p-5"
        }`}
      >
        <div className="mr-1 flex items-center gap-1.5" role="group" aria-label="Choose slide">
          {slides.map((slide, index) => {
            const active = index === selected;
            return (
              <button
                key={slide.title}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Show slide ${index + 1}: ${slide.title}`}
                aria-current={active ? "true" : undefined}
                className={`relative h-1.5 overflow-hidden rounded-full bg-white/35 transition-[width] duration-500 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${
                  active ? "w-10" : "w-1.5 hover:bg-white/60"
                }`}
              >
                {active && (
                  <span
                    key={timerKey}
                    aria-hidden
                    style={progressStyle}
                    className={`absolute inset-y-0 left-0 rounded-full bg-white ${
                      running && timerRunning ? "hero-progress" : "w-full"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <CarouselButton label="Previous slide" onClick={goPrev}>
          <ChevronLeftIcon className="h-4 w-4" />
        </CarouselButton>
        <CarouselButton label="Next slide" onClick={goNext}>
          <ChevronRightIcon className="h-4 w-4" />
        </CarouselButton>
        <CarouselButton label={playing ? "Pause slideshow" : "Play slideshow"} onClick={togglePlaying}>
          {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-3.5 w-3.5" />}
        </CarouselButton>
      </div>
    </section>
  );
}

function CarouselButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    >
      {children}
    </button>
  );
}

function FramedCaption({ slide }: { slide: HeroSlide }) {
  return (
    <>
      <div className="absolute inset-0 bg-linear-to-t from-forest-900/80 via-forest-900/10 to-transparent" />
      <div className="hero-copy absolute inset-x-0 bottom-0 p-5 pb-20 text-white sm:p-6 sm:pb-20">
        {slide.eyebrow && <p className="font-mono text-[0.6875rem] tracking-wide text-white/70">{slide.eyebrow}</p>}
        {slide.href ? (
          <Link
            href={slide.href}
            className="group mt-1 inline-flex items-center gap-2 font-display text-2xl font-semibold tracking-tight focus-visible:underline focus-visible:outline-none"
          >
            {slide.title}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{slide.title}</p>
        )}
      </div>
    </>
  );
}

function CinematicCaption({ slide, index, total }: { slide: HeroSlide; index: number; total: number }) {
  return (
    <>
      {/* Two scrims: one from the left for the copy, one from the bottom for the controls. */}
      <div className="absolute inset-0 bg-linear-to-r from-forest-900/90 via-forest-900/45 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-forest-900/70 via-transparent to-forest-900/25" />

      <div className="hero-copy absolute inset-0 mx-auto flex max-w-[1240px] flex-col justify-end px-5 pb-28 text-white sm:px-8 sm:pb-32 lg:justify-center lg:pb-0">
        <p className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-white/70 uppercase">
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          {slide.eyebrow && (
            <>
              <span aria-hidden className="h-px w-8 bg-white/40" />
              {slide.eyebrow}
            </>
          )}
        </p>
        <h2 className="mt-5 max-w-[12ch] font-display text-[clamp(3.2rem,9vw,8rem)] leading-[0.92] font-semibold tracking-tight text-balance">
          {slide.title}
        </h2>
        {slide.description && (
          <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-white/80 sm:text-lg">{slide.description}</p>
        )}
        {slide.href && (
          <div className="mt-8">
            <Link
              href={slide.href}
              className="group inline-flex items-center gap-3 rounded-full border border-white/60 py-3 pr-3 pl-6 text-sm font-semibold transition-colors hover:bg-white hover:text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {slide.cta ?? "Explore"}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-1">
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
