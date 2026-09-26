// Semantic stock placeholders (Unsplash License) standing in for real museum photography.
// Every entry is used in exactly one spot across Home/Gallery/Visit/About — keep them unique.
// Replace each entry with a curator-supplied image when available.
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const PLACEHOLDER_IMAGES = {
  // Page hero backgrounds
  heroHome: unsplash("1500354960738-4c480ed785bc"), // misty tropical rainforest canopy
  heroGallery: unsplash("1508026155071-961dae008723"), // museum hall with whale skeleton
  heroVisit: unsplash("1534739302117-e9ff126dec91"), // visitor viewing a fossil exhibit
  heroAbout: unsplash("1630959305790-4c956ce6c0b6"), // researcher at a microscope

  // Home — collection cards
  entomologyCard: unsplash("1590557425376-a180474fb8a1"), // plain tiger butterfly
  herpetologyCard: unsplash("1698435354321-0bccb1549b4d"), // red-eyed tree frog on a leaf
  marineCard: unsplash("1581242163722-caf37479b25c"), // clownfish in an anemone

  // Home — "Science in Service of Society"
  homeScience: unsplash("1720714411649-74f22df976f5"), // pressed herbarium specimen

  // Gallery — exhibit areas
  entomologyWide: unsplash("1779732933715-c0739352198d"), // pinned butterflies and insects
  herpetologyWide: unsplash("1565239866281-b4c953e61eca"), // gecko silhouette on a banana leaf
  marineWide: unsplash("1568785629399-0cd9324febdf"), // green sea turtle over a reef

  // About — "Through the Years"
  aboutHistory: unsplash("1763909130873-bbde2fe7f464"), // preserved beetle collection

  // Curator login showcase (not a public page)
  authShowcase: unsplash("1583212292454-1fe6229603b7"), // coral reef
} as const;
