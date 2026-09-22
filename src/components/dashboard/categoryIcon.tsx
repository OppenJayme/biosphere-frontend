import type { ComponentType, SVGProps } from "react";
import { BugIcon, LizardIcon, LeafIcon, PawIcon, FishIcon } from "@/components/icons";

const KEYWORD_ICONS: [pattern: RegExp, icon: ComponentType<SVGProps<SVGSVGElement>>][] = [
  [/insect/i, BugIcon],
  [/reptile/i, LizardIcon],
  [/(botany|plant)/i, LeafIcon],
  [/(mammal|bird)/i, PawIcon],
  [/(marine|fish|aquatic)/i, FishIcon],
];

// specimenCategory is free-text on the backend, not an enum, so this matches
// on keywords with a generic fallback rather than an exhaustive lookup.
export function categoryIcon(category: string | null): ComponentType<SVGProps<SVGSVGElement>> {
  if (!category) return PawIcon;
  const match = KEYWORD_ICONS.find(([pattern]) => pattern.test(category));
  return match ? match[1] : PawIcon;
}
