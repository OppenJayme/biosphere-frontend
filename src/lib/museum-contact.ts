/**
 * The museum's phone numbers, as supplied by the museum (2026-11-07) and shown on the Visit and
 * About pages. The landline is the USC trunk line plus local 122; the comma in its tel: link makes
 * phones pause before dialing the local.
 */
export const MUSEUM_PHONES = {
  landline: { label: "032-230-0100-122", href: "tel:+63322300100,122" },
  mobile: { label: "+63 956 689 2497", href: "tel:+639566892497" },
} as const;
