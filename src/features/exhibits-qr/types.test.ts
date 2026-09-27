import { describe, expect, it } from "vitest";
import {
  createExhibitSchema,
  publicExhibitSchema,
  qrCodeInfoSchema,
} from "./types";

describe("exhibit QR API contracts", () => {
  it("accepts the backend public exhibit response", () => {
    const result = publicExhibitSchema.safeParse({
      publicSlug: "six-legged-carabao",
      interestingFacts: "A field note.",
      publicDescription: "A public description.",
      distribution: "Mindanao",
      diet: null,
      layoutType: "card-grid",
      media: [
        {
          mediaUrl: "https://storage.example.test/exhibit.jpg?token=temporary",
          displayOrder: 0,
          caption: null,
          isCover: true,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts QR info and validates generated slugs against the backend contract", () => {
    expect(
      qrCodeInfoSchema.safeParse({
        exhibitId: "44444444-4444-4444-8444-444444444444",
        publicSlug: "six-legged-carabao",
        publicUrl: "https://museum.example.test/exhibits/six-legged-carabao",
      }).success,
    ).toBe(true);

    expect(
      createExhibitSchema.safeParse({
        specimenId: "33333333-3333-4333-8333-333333333333",
        publicSlug: "Bad Slug",
      }).success,
    ).toBe(false);
  });
});