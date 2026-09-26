import { BugIcon, FishIcon, LizardIcon } from "@/components/icons";
import { PLACEHOLDER_IMAGES } from "@/lib/placeholder-images";
import entomologyBadge from "@/assets/collections/entomology-badge.png";
import herpetologyBadge from "@/assets/collections/herpetology-badge.png";
import marineBiologyBadge from "@/assets/collections/marine-biology-badge.png";
// Ring-free versions of the badges for small sizes, where the thin outer rings blur.
import entomologyMark from "@/assets/collections/entomology-mark.png";
import herpetologyMark from "@/assets/collections/herpetology-mark.png";
import marineBiologyMark from "@/assets/collections/marine-biology-mark.png";

export const COLLECTIONS = [
  {
    slug: "entomology",
    name: "Entomology",
    taxon: "Class Insecta",
    icon: BugIcon,
    badge: entomologyBadge,
    mark: entomologyMark,
    image: PLACEHOLDER_IMAGES.entomologyCard,
    imageWide: PLACEHOLDER_IMAGES.entomologyWide,
    shortDescription: "Insects showcasing extraordinary form, function, and ecological roles.",
    description:
      "Step into the fascinating world of insects, tiny creatures with extraordinary adaptations. From vibrant butterflies to elusive beetles, this exhibit reveals their beauty, diversity, and ecological importance.",
    features: [
      "Pinned specimen displays",
      "Macro photography stations",
      "Pollinator conservation notes",
    ],
  },
  {
    slug: "herpetology",
    name: "Herpetology",
    taxon: "Amphibians and reptiles",
    icon: LizardIcon,
    badge: herpetologyBadge,
    mark: herpetologyMark,
    image: PLACEHOLDER_IMAGES.herpetologyCard,
    imageWide: PLACEHOLDER_IMAGES.herpetologyWide,
    shortDescription: "Amphibians and reptiles of the Philippines and beyond.",
    description:
      "Explore the reptiles and amphibians of the Philippines and beyond, from camouflaged geckos to vibrant tree frogs, and the conservation stories behind them.",
    features: [
      "Live and preserved specimens",
      "Skin and scale close-ups",
      "Habitat and behavior notes",
    ],
  },
  {
    slug: "marine-biology",
    name: "Marine Biology",
    taxon: "Marine organisms",
    icon: FishIcon,
    badge: marineBiologyBadge,
    mark: marineBiologyMark,
    image: PLACEHOLDER_IMAGES.marineCard,
    imageWide: PLACEHOLDER_IMAGES.marineWide,
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
