import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(async () => ({ id: "curator" })),
}));
vi.mock("@/lib/api-client", () => ({
  ApiError: class extends Error {
    constructor(
      public status: number,
      public body: unknown,
    ) {
      super("API error");
    }
  },
}));
vi.mock("./api", () => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

import { ApiError } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import { createCollection } from "./api";
import { createCollectionAction } from "./collection-actions";

describe("collection conflict feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("preserves the entered name and explains a normalized name collision", async () => {
    vi.mocked(createCollection).mockRejectedValue(
      new ApiError(409, { code: "COLLECTION_NAME_TAKEN" }),
    );
    const form = new FormData();
    form.set("collectionName", "Entomology");
    expect(await createCollectionAction({ value: "" }, form)).toEqual({
      value: "Entomology",
      error: "A collection with this name already exists. Choose a different name.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("keeps a distinct retry message for concurrent changes", async () => {
    vi.mocked(createCollection).mockRejectedValue(new ApiError(409, { message: "retry" }));
    const form = new FormData();
    form.set("collectionName", "Entomology");
    expect((await createCollectionAction({ value: "" }, form)).error).toMatch(
      /Reload and try again/,
    );
  });
});
