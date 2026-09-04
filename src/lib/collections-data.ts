import { BugIcon, FishIcon, LizardIcon } from "@/components/icons";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";

export const COLLECTIONS = [
  {
    slug: "entomology",
    name: "Entomology",
    icon: BugIcon,
    image: null,
    imageWide: null,
    shortDescription: "Insects showcasing extraordinary form, function, and ecological roles.",
    description:
      "Step into the fascinating world of insects — tiny creatures with extraordinary adaptations. From vibrant butterflies to elusive beetles, this exhibit reveals their beauty, diversity, and ecological importance.",
    features: [
      "Pinned specimen displays",
      "Macro photography stations",
      "Pollinator conservation notes",
    ],
  },
  {
    slug: "herpetology",
    name: "Herpetology",
    icon: LizardIcon,
    image: null,
    imageWide: null,
    shortDescription: "Amphibians and reptiles of the Philippines and beyond.",
    description:
      "Explore the reptiles and amphibians of the Philippines and beyond — from camouflaged geckos to vibrant tree frogs — and the conservation stories behind them.",
    features: [
      "Live and preserved specimens",
      "Skin and scale close-ups",
      "Habitat and behavior notes",
    ],
  },
  {
    slug: "marine-biology",
    name: "Marine Biology",
    icon: FishIcon,
    image: PLACEHOLDER_IMAGES.marineCoral,
    imageWide: PLACEHOLDER_IMAGES.marineReefWide,
    shortDescription: "Marine organisms and ecosystems that sustain life beneath our seas.",
    description:
      "Dive into the marine organisms and ecosystems that sustain life beneath our seas, from coral reefs to the countless species that call them home.",
    features: [
      "Reef ecosystem models",
      "Shell and coral specimens",
      "Ocean conservation insights",
    ],
  },
] as const;
