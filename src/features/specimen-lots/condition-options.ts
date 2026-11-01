/**
 * Suggested condition classifications for the lot forms and filters. The database column stays
 * free text (conditions are curator-extensible, REQ-4.4-14), so "Other…" keeps unlisted values
 * possible and existing unlisted values remain valid.
 */

export const CONDITION_OPTIONS = ["Excellent", "Good", "Fair", "Poor", "Critical"] as const;

/** Select-only marker for "Other…"; never a condition that may be saved. */
export const OTHER_CONDITION_VALUE = "__other__";

/**
 * Collapses whitespace like the backend and adopts the listed spelling, so typing "good" under
 * Other cannot create a second spelling beside "Good" on the case-sensitive lot unique index.
 */
export function normalizeConditionClass(value: string) {
  const text = value.trim().replace(/\s+/g, " ");
  if (text === OTHER_CONDITION_VALUE) return "";

  const folded = text.toLocaleLowerCase();
  return CONDITION_OPTIONS.find((option) => option.toLocaleLowerCase() === folded) ?? text;
}

export function isListedCondition(value: string) {
  return (CONDITION_OPTIONS as readonly string[]).includes(value);
}
