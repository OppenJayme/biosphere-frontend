// DUMMY DATA — placeholder for the QR Exhibits pages (curator management UI +
// the standalone public exhibit viewer). Stands in for real backend responses.
// Once the NestJS API is up, replace with calls through `features/exhibits-qr/api.ts`
// -> `apiFetch` (see docs/frontend-architecture.md) and delete this file.

import type { SpecimenGroup } from "./specimens";

export const EXHIBIT_FILTERS = {
  publishStatus: ["Publish Status", "All", "Published", "Draft", "Needs Review"],
  arStatus: ["AR Status", "All", "With AR", "No AR"],
  qrStatus: ["QR Status", "All", "QR Enabled", "Not Generated"],
} as const;

export type PublishStatus = "Published" | "Draft" | "Needs Review";
export type PublicLayout = "card-grid" | "mobile-accordion";

export type Taxonomy = {
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
  species: string;
};

export type Exhibit = {
  slug: string;
  accessionNo: string;
  group: SpecimenGroup;
  commonName: string;
  scientificName: string;
  collectionType: string;
  images: string[];
  tags: string[];
  description: string;
  taxonomy: Taxonomy;
  habitat: string;
  ecologicalRole: string;
  conservationStatus: string;
  distribution: string;
  diet: string;
  funFacts: string[];
  arEnabled: boolean;
  qrEnabled: boolean;
  publishStatus: PublishStatus;
  publicLayout: PublicLayout;
  primaryLocation: string;
  updatedAt: string;
  updatedBy: string;
};

export const EXHIBITS: Exhibit[] = [
  {
    slug: "giant-forest-beetle",
    accessionNo: "USCBM-ENT-2025-001",
    group: "insect",
    commonName: "Giant Forest Beetle",
    scientificName: "Titanus giganteus",
    collectionType: "Entomology",
    images: [
      "https://images.unsplash.com/photo-1619532474053-e9de8d7d4046",
      "https://images.unsplash.com/photo-1635495672951-314b0d4e6d28",
      "https://images.unsplash.com/photo-1695137270533-f6470ee073f5",
    ],
    tags: ["Insect", "Philippines"],
    description:
      "The Giant Forest Beetle is one of the largest beetles found in tropical forests. Males are known for their impressive mandibles used in defense and mating.",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Arthropoda",
      class: "Insecta",
      order: "Coleoptera",
      family: "Eucanidae",
      genus: "Titanus",
      species: "giganteus",
    },
    habitat: "Tropical rainforest",
    ecologicalRole: "Ecosystem engineers",
    conservationStatus: "Least Concern",
    distribution: "Mindanao, Philippines",
    diet: "Sap, Fruits",
    funFacts: [
      "One of the largest beetles in the world by sheer body mass.",
      "Its mandibles can snap a pencil in half.",
      "Adults rarely feed — most energy comes from the larval stage.",
    ],
    arEnabled: true,
    qrEnabled: true,
    publishStatus: "Published",
    publicLayout: "card-grid",
    primaryLocation: "USC Biological Museum · Exhibit Hall A – Invertebrates",
    updatedAt: "May 22, 2025 9:30 AM",
    updatedBy: "Dr. Sheldon",
  },
  {
    slug: "green-sea-turtle",
    accessionNo: "USCBM-REP-2025-002",
    group: "marine",
    commonName: "Green Sea Turtle",
    scientificName: "Chelonia mydas",
    collectionType: "Marine Biology",
    images: [
      "https://images.unsplash.com/photo-1591025207163-942350e47db2",
      "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f",
    ],
    tags: ["Reptile", "Marine", "Philippines"],
    description:
      "The Green Sea Turtle is a large marine turtle found throughout the Philippines' coral reefs and seagrass beds. It plays a key role in maintaining healthy seagrass meadows.",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Reptilia",
      order: "Testudines",
      family: "Cheloniidae",
      genus: "Chelonia",
      species: "mydas",
    },
    habitat: "Coral reefs, seagrass meadows",
    ecologicalRole: "Seagrass grazer",
    conservationStatus: "Endangered",
    distribution: "Tropical and subtropical coastlines worldwide",
    diet: "Seagrass, algae",
    funFacts: [
      "Can hold its breath for up to five hours while resting.",
      "Named for the greenish color of its body fat, not its shell.",
      "Females return to the same beach where they hatched to lay eggs.",
    ],
    arEnabled: true,
    qrEnabled: true,
    publishStatus: "Published",
    publicLayout: "mobile-accordion",
    primaryLocation: "USC Biological Museum · Exhibit Hall B – Marine Life",
    updatedAt: "May 21, 2025 2:18 PM",
    updatedBy: "Sarah Reyes",
  },
  {
    slug: "albino-carabao",
    accessionNo: "USCBM-MAM-2025-003",
    group: "mammal",
    commonName: "Albino Carabao",
    scientificName: "Bubalus bubalis",
    collectionType: "Mammalogy",
    images: [
      "https://images.unsplash.com/photo-1571566834017-471126f4e366",
    ],
    tags: ["Mammal", "Philippines"],
    description:
      "The Philippine carabao is a domesticated water buffalo central to rural agriculture. This specimen displays albinism, a rare recessive trait documented in the museum's collection.",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Mammalia",
      order: "Artiodactyla",
      family: "Bovidae",
      genus: "Bubalus",
      species: "bubalis",
    },
    habitat: "Lowland farmland, wetlands",
    ecologicalRole: "Grazer, draft animal",
    conservationStatus: "Domesticated",
    distribution: "Philippines (nationwide)",
    diet: "Grasses, rice straw",
    funFacts: ["The carabao is the national animal of the Philippines."],
    arEnabled: false,
    qrEnabled: true,
    publishStatus: "Draft",
    publicLayout: "card-grid",
    primaryLocation: "USC Biological Museum · Exhibit Hall C – Mammals",
    updatedAt: "May 20, 2025 11:05 AM",
    updatedBy: "Mark Cruz",
  },
  {
    slug: "reticulated-python",
    accessionNo: "USCBM-REP-2025-004",
    group: "reptile",
    commonName: "Reticulated Python",
    scientificName: "Malayopython reticulatus",
    collectionType: "Herpetology",
    images: [
      "https://images.unsplash.com/photo-1570741066052-817c6de995c8",
    ],
    tags: ["Reptile", "Non-venomous", "Philippines"],
    description:
      "One of the longest snake species in the world, the Reticulated Python is a powerful constrictor found across Southeast Asian forests and grasslands.",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Reptilia",
      order: "Squamata",
      family: "Pythonidae",
      genus: "Malayopython",
      species: "reticulatus",
    },
    habitat: "Rainforest, grassland, near water",
    ecologicalRole: "Apex mesopredator",
    conservationStatus: "Least Concern",
    distribution: "Southeast Asia, including the Philippines",
    diet: "Small to medium mammals, birds",
    funFacts: [
      "Can grow beyond 6 meters in length.",
      "An excellent swimmer, often found near rivers.",
    ],
    arEnabled: true,
    qrEnabled: true,
    publishStatus: "Needs Review",
    publicLayout: "mobile-accordion",
    primaryLocation: "USC Biological Museum · Exhibit Hall A – Herpetology",
    updatedAt: "May 19, 2025 4:41 PM",
    updatedBy: "Sarah Reyes",
  },
  {
    slug: "blue-naped-parrot",
    accessionNo: "USCBM-AVI-2025-005",
    group: "insect",
    commonName: "Blue-naped Parrot",
    scientificName: "Tanygnathus lucionensis",
    collectionType: "Ornithology",
    images: [
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3",
    ],
    tags: ["Bird", "Endemic", "Philippines"],
    description:
      "The Blue-naped Parrot is a vulnerable endemic species prized for its striking plumage — and, unfortunately, heavily trapped for the illegal pet trade.",
    taxonomy: {
      kingdom: "Animalia",
      phylum: "Chordata",
      class: "Aves",
      order: "Psittaciformes",
      family: "Psittaculidae",
      genus: "Tanygnathus",
      species: "lucionensis",
    },
    habitat: "Lowland and forest edge",
    ecologicalRole: "Seed disperser",
    conservationStatus: "Vulnerable",
    distribution: "Endemic to the Philippines",
    diet: "Fruits, seeds, nectar",
    funFacts: ["Threatened primarily by illegal wildlife trade, not habitat loss."],
    arEnabled: false,
    qrEnabled: true,
    publishStatus: "Draft",
    publicLayout: "card-grid",
    primaryLocation: "USC Biological Museum · Exhibit Hall C – Birds",
    updatedAt: "May 18, 2025 10:12 AM",
    updatedBy: "Mark Cruz",
  },
  {
    slug: "waling-waling-orchid",
    accessionNo: "USCBM-BOT-2025-006",
    group: "botany",
    commonName: "Waling-waling Orchid",
    scientificName: "Vanda sanderiana",
    collectionType: "Botany",
    images: [
      "https://images.unsplash.com/photo-1610397648930-477b8c7f0943",
    ],
    tags: ["Endemic", "Endangered", "Philippines"],
    description:
      "Considered one of the most beautiful orchids in the world, the Waling-waling is endemic to Mindanao and holds deep cultural significance in the Philippines.",
    taxonomy: {
      kingdom: "Plantae",
      phylum: "Tracheophyta",
      class: "Liliopsida",
      order: "Asparagales",
      family: "Orchidaceae",
      genus: "Vanda",
      species: "sanderiana",
    },
    habitat: "Epiphytic, lowland forest canopy",
    ecologicalRole: "Pollinator attractor",
    conservationStatus: "Endangered",
    distribution: "Endemic to Mindanao, Philippines",
    diet: "Photosynthetic — n/a",
    funFacts: ["A single healthy plant can produce dozens of blooms in one flowering cycle."],
    arEnabled: false,
    qrEnabled: false,
    publishStatus: "Draft",
    publicLayout: "mobile-accordion",
    primaryLocation: "USC Biological Museum · Exhibit Hall D – Botany",
    updatedAt: "May 15, 2025 8:55 AM",
    updatedBy: "Dr. Sheldon",
  },
];

export const EXHIBIT_STATS = [
  { label: "Total Exhibits", value: "128", note: "+12 this month", tone: "positive", icon: "cube" },
  { label: "Published", value: "86", note: "67.2% of total", tone: "positive", icon: "specimen" },
  { label: "With AR", value: "64", note: "50.0% of total", tone: "danger", icon: "ar" },
  { label: "Drafts / Unpublished", value: "42", note: "32.8% of total", tone: "warning", icon: "draft" },
  { label: "QR Enabled", value: "124", note: "96.9% of total", tone: "positive", icon: "qr" },
] as const;
