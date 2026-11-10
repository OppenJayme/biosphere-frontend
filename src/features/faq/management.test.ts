import { describe, expect, it } from "vitest";
import { readFaqForm } from "./management";

describe("FAQ knowledge form parsing", () => {
  it("normalizes lists and removes case-insensitive duplicates", () => {
    const form = new FormData();
    form.set("question", " When is the museum open? ");
    form.set("answer", " During approved hours. ");
    form.set("alternativeWording", "What are the hours?\n  Museum   hours  \nwhat are the hours?");
    form.set("keywords", "Hours\nhours\nvisit");
    form.set("category", " Visit ");

    const parsed = readFaqForm(form);
    expect(parsed.result.success && parsed.result.data).toEqual({
      question: "When is the museum open?",
      answer: "During approved hours.",
      alternativeWording: ["What are the hours?", "Museum hours"],
      keywords: ["Hours", "visit"],
      category: "Visit",
    });
  });

  it("requires a question and approved answer while allowing optional lists", () => {
    const form = new FormData();
    form.set("question", " ");
    form.set("answer", " ");

    expect(readFaqForm(form).result.success).toBe(false);
  });
});
