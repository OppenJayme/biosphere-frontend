import type { CSSProperties } from "react";

/** Position in a `.rise` entrance sequence (see globals.css); each step adds 90ms of delay. */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}
