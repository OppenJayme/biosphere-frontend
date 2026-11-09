import { describe, expect, it } from "vitest";
import { TYPEWRITER_MAX_TICKS, nextTypedLength, typewriterStep } from "./typewriter";

function ticksToFinish(length: number) {
  let shown = 0;
  let ticks = 0;
  while (shown < length) {
    shown = nextTypedLength(shown, length);
    ticks += 1;
  }
  return ticks;
}

describe("typewriter pacing", () => {
  it("reveals at least two characters per tick", () => {
    expect(typewriterStep(0)).toBe(2);
    expect(typewriterStep(10)).toBe(2);
  });

  it("finishes any reply within the tick budget", () => {
    for (const length of [1, 40, 150, 500, 2000]) {
      expect(ticksToFinish(length)).toBeLessThanOrEqual(TYPEWRITER_MAX_TICKS);
    }
  });

  it("never reveals past the end of the text", () => {
    expect(nextTypedLength(9, 10)).toBe(10);
    expect(nextTypedLength(10, 10)).toBe(10);
  });
});
