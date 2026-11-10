/** Contract tests for collection query normalization and curator-entered names. */

import { describe, expect, it } from "vitest";
import {
  collectionListHref,
  collectionMutationSchema,
  parseCollectionListQuery,
} from "./collection-management";

describe("collection management", () => {
  it("normalizes a valid list query and preserves it in pagination links", () => {
    const query = parseCollectionListQuery({ search: "  Zoological  ", page: "3" });

    expect(query).toEqual({ search: "Zoological", page: 3, limit: 25 });
    expect(collectionListHref(query, 4)).toBe(
      "/specimens/collections?search=Zoological&page=4",
    );
  });

  it("falls back safely for invalid or excessive URL values", () => {
    const query = parseCollectionListQuery({ search: "x".repeat(150), page: "-2" });

    expect(query.search).toHaveLength(100);
    expect(query.page).toBe(1);
    expect(collectionListHref(query, 1)).not.toContain("page=");
  });

  it("trims names while keeping curator-extensible values", () => {
    expect(collectionMutationSchema.parse({ collectionName: "  Marine Invertebrates  " }))
      .toEqual({ collectionName: "Marine Invertebrates" });
    expect(collectionMutationSchema.safeParse({ collectionName: "   " }).success).toBe(false);
    expect(
      collectionMutationSchema.safeParse({ collectionName: "x".repeat(256) }).success,
    ).toBe(false);
  });
});
