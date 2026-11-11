---
name: biosphere-museum-design-system
source: extracted-from-code
character: "A natural history museum's working tool. Deep forest green and a little warm gold on calm off white, quiet and trustworthy. The curator app is dense and precise (small type, hairline cards); the public site is airy and editorial (large display type, gentle motion)."
tokens: "real values live in src/app/globals.css (:root custom properties plus the @theme inline block); read them there, never duplicated here"
contrast: "verified 2026-11-11 on white or paper: ink 14.9:1, ink-muted 6.5:1, zinc-500 4.8:1, forest-700 10.5:1, white on brand-solid 10.5:1, forest-700 on forest-100 8.4:1, gold-700 5.1:1; gold-600 is 3.9:1, so it is for large text, icons, and fills only, never small text"
---

# BioSphere design direction

Written by `/develop` on 2026-11-11 from the existing UI (`src/app/globals.css`,
`src/components/dashboard/Panel.tsx`, `src/components/public-website/*`,
`src/components/visit/RequestVisitForm.tsx`, `src/components/ui/Button.tsx`) so new
screens match what is already shipped. Token values are in `globals.css`; this file is
direction only. Light theme only today: neither the curator app nor the public site has
a dark theme, so do not add `dark:` variants piecemeal.

## Build mandate

You are a senior product designer. Every screen ships as a complete, professional product
surface in this system: real museum copy, a considered layout with hierarchy, and every
state (empty, loading, error). Never a bare widget on an empty page. The full disqualifier
list is the `/develop` UI guide's bar. New work must look like it was always part of the
app: reuse the existing card, badge, button, and timeline patterns before inventing one.

## Character & direction

- **Curator app**: a calm, dense work surface. White cards on a white page with hairline
  `black/10` borders, small type (`text-xs`/`text-sm`), zinc neutrals for text, forest
  green for anything actionable, and pastel status pills. Page titles use the serif
  display face (`font-serif`, forest-800); everything else is the sans (Geist).
- **Public site**: the same palette through the semantic tokens (`paper`, `surface`,
  `ink`, `ink-muted`, `line`, `brand`, `brand-soft`, `accent`). Large `font-display`
  headings with tight tracking, generous whitespace, fully rounded primary buttons, and
  the `rise`/`reveal` motion (skipped under reduced motion).
- Gold is an accent for emphasis and secondary calls to action, used sparingly.

## Composition patterns

- **Curator page**: `PageHeader` (serif title, one line description, actions on the
  right), then sections stacked with `space-y-4`/`space-y-5`. Each section is a card:
  `rounded-xl border border-black/10 bg-white p-5`.
- **Dashboard**: a responsive grid of `Panel` cards (`grid gap-4`, two or three columns at
  `xl`); a panel has a `text-sm font-semibold` title, optional info tip, and a
  "View all" link with an arrow at the top right. Empty and error states sit inside the
  panel as one muted line.
- **Visit Requests / General Inquiries**: toolbar (status chips, search, date filters),
  then the list card, then the management detail below it. A detail opens through the
  `selected` URL parameter, so any view that lists records links to that same URL.
- **Public forms**: fields grouped under small uppercase group labels
  (`FieldGroupLabel`), each repeated group in its own `rounded-xl border border-line p-4`
  box, hints in `text-sm text-ink-muted`, errors through `FieldError` and `FormAlert`.

## Component & usage rules (do's and don'ts)

- Forest (`brand-solid`, `forest-700`) is for primary actions, links, focus rings, and the
  "selected" state. Do not use it as decoration on large areas in the curator app.
- Hover in the curator app is `bg-sage-100` or `bg-forest-100`; selected is
  `bg-forest-50` plus forest text or a forest left edge.
- Status colour always comes from `StatusBadge` (`VISIT_STYLES`/`INQUIRY_STYLES`); reuse it,
  and reuse the same colour family when a status appears as a calendar chip or dot.
- Elevation is hairline borders, not shadows. Shadows only on overlays (menus, dialogs).
- Radius: `rounded-md` for small controls, `rounded-lg` for buttons and inputs in the
  curator app, `rounded-xl` for cards, `rounded-full` for pills and public buttons.
- Spacing follows Tailwind's 4px scale; card padding `p-5`, gaps `gap-3`/`gap-4`.
- Icons come from `src/components/icons.tsx`, sized `h-3.5 w-3.5` to `h-4 w-4`, hidden
  from assistive tech when decorative.
- Timeline dots (`HistoryTimeline`): forest for status and referral, sky for notes, amber
  for emails BioSphere sent. A new entry kind gets its own colour from the same 500 step.
- Never put small text in gold-600 (fails contrast); use gold-700 if gold text is needed.

## Responsive & accessibility direction

- Curator screens must work from a 375px phone up; grids collapse to one column below
  `sm`/`xl`, and wide tables or grids scroll inside their card rather than the page.
- Every interactive element is a real `button`/`a`/`input` with a visible
  `focus-visible` outline in forest. Toggle groups expose `aria-pressed` or are radio
  groups; live counts use `aria-live="polite"`.
- Dates are shown as calendar dates in museum time (Asia/Manila) using the helpers in
  `src/features/public-submissions/schedule.ts`; never format a calendar date in the
  browser's own time zone.
