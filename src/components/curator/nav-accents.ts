// One colour per curator nav destination. The sidebar uses it for its icons,
// and links elsewhere that lead to the same place (dashboard quick actions)
// reuse it so a destination looks the same wherever it appears.
//
// Full class names (not built from the hue) so Tailwind finds them. Each hue
// is at least 3:1 against white, sage-100 (hover) and forest-100 (selected
// pill, quick-action circle), the WCAG minimum for icons; the 600 step is used
// only where it passes on all three.
//
// `hover` applies under a `group` parent, on hover and on keyboard focus.

export type NavAccent = { selected: string; hover: string };

export const NAV_ACCENTS = {
  dashboard: { selected: "text-emerald-700", hover: "group-hover:text-emerald-700 group-focus-visible:text-emerald-700" },
  specimens: { selected: "text-amber-700", hover: "group-hover:text-amber-700 group-focus-visible:text-amber-700" },
  cataloging: { selected: "text-sky-700", hover: "group-hover:text-sky-700 group-focus-visible:text-sky-700" },
  locations: { selected: "text-rose-600", hover: "group-hover:text-rose-600 group-focus-visible:text-rose-600" },
  inquiries: { selected: "text-blue-600", hover: "group-hover:text-blue-600 group-focus-visible:text-blue-600" },
  visits: { selected: "text-violet-600", hover: "group-hover:text-violet-600 group-focus-visible:text-violet-600" },
  exhibits: { selected: "text-teal-700", hover: "group-hover:text-teal-700 group-focus-visible:text-teal-700" },
  faq: { selected: "text-fuchsia-600", hover: "group-hover:text-fuchsia-600 group-focus-visible:text-fuchsia-600" },
  reports: { selected: "text-orange-700", hover: "group-hover:text-orange-700 group-focus-visible:text-orange-700" },
  audit: { selected: "text-indigo-600", hover: "group-hover:text-indigo-600 group-focus-visible:text-indigo-600" },
  backups: { selected: "text-cyan-700", hover: "group-hover:text-cyan-700 group-focus-visible:text-cyan-700" },
  users: { selected: "text-pink-600", hover: "group-hover:text-pink-600 group-focus-visible:text-pink-600" },
} as const satisfies Record<string, NavAccent>;
