// Images for the public pages (Home/Gallery/Visit/About) and the curator login showcase.
// Museum photos are local files under src/assets; the remaining entries are still
// semantic stock placeholders (Unsplash License) until a museum photo is supplied.
// Every entry is used in exactly one spot — keep them unique.
import aboutHero from "@/assets/about/about_topbanner_enrique-schoenig.jpg";
import aboutHistory from "@/assets/about/about_preservation.jpg";
import galleryHero from "@/assets/gallery/gallery_explore_banner.jpg";
import galleryEntomology from "@/assets/gallery/gallery_entomology_exhibit.jpg";
import galleryHerpetology from "@/assets/gallery/gallery_herpetology_exhibit.jpg";
import galleryMarine from "@/assets/gallery/gallery_marine_exhibit.jpg";
import homeEntomology from "@/assets/home/home_entomology_card.jpg";
import homeHerpetology from "@/assets/home/home_herpetology_card.jpg";
import homeMarine from "@/assets/home/home_marine_card.jpg";
import visitHero from "@/assets/visit/visit_topbanner.jpg";

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const PLACEHOLDER_IMAGES = {
  // Page hero backgrounds
  heroHome: unsplash("1500354960738-4c480ed785bc"), // stock: misty tropical rainforest canopy
  heroGallery: galleryHero, // museum: exhibit hall with display cases
  heroVisit: visitHero, // museum: grasshopper close-up from the exhibit
  heroAbout: aboutHero, // museum: portrait of Enrique Schoenig

  // Home — collection cards
  entomologyCard: homeEntomology,
  herpetologyCard: homeHerpetology,
  marineCard: homeMarine,

  // Home — "Science in Service of Society"
  homeScience: unsplash("1720714411649-74f22df976f5"), // stock: pressed herbarium specimen

  // Gallery — exhibit areas
  entomologyWide: galleryEntomology,
  herpetologyWide: galleryHerpetology,
  marineWide: galleryMarine,

  // About — "Through the Years"
  aboutHistory, // museum: display cabinets of preserved specimens

  // Curator login showcase (not a public page)
  authShowcase: unsplash("1583212292454-1fe6229603b7"), // stock: coral reef
} as const;
