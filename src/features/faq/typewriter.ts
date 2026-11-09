/**
 * Pacing for the museum assistant's typed-out replies. A reply is revealed a few characters per
 * tick so short answers feel typed and long ones still finish in about a second and a half.
 * The reveal is visual only: the widget gives assistive technology the full text at once.
 */

export const TYPEWRITER_TICK_MS = 20;
/** Upper bound on ticks per reply, so long answers never keep the visitor waiting. */
export const TYPEWRITER_MAX_TICKS = 75;
const MIN_CHARS_PER_TICK = 2;

/** Characters revealed per tick for a reply of this length. */
export function typewriterStep(length: number) {
  return Math.max(MIN_CHARS_PER_TICK, Math.ceil(length / TYPEWRITER_MAX_TICKS));
}

/** The next revealed length, never past the end of the text. */
export function nextTypedLength(current: number, total: number) {
  return Math.min(total, current + typewriterStep(total));
}
