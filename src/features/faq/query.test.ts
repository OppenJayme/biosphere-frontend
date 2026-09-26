import { describe, expect, it } from "vitest";
import { faqKnowledgeHref, parseFaqListQuery } from "./query";

describe("FAQ knowledge query handling", () => {
  it("keeps approved filters and creates stable pagination links", () => {
    const query = parseFaqListQuery({ status: "ACTIVE", category: " Visit ", page: "3" });

    expect(query).toEqual({ status: "ACTIVE", category: "Visit", page: 3, limit: 25 });
    expect(faqKnowledgeHref(query)).toBe("/faq-knowledge?status=ACTIVE&category=Visit&page=3");
  });

  it("falls back safely for unsupported URL values", () => {
    const query = parseFaqListQuery({ status: "PUBLISHED", page: "-2" });

    expect(query).toEqual({ status: "", category: "", page: 1, limit: 25 });
    expect(faqKnowledgeHref(query)).toBe("/faq-knowledge");
  });
});
