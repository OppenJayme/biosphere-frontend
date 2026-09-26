/** Form parsing for curator FAQ knowledge without introducing matching rules. */

import { z } from "zod";

export type FaqFormValues = {
  question: string;
  answer: string;
  alternativeWording: string;
  keywords: string;
  category: string;
};

export type FaqFormState = {
  values: FaqFormValues;
  message?: string;
};

export type FaqCommandState = { message?: string };

const normalizedTerms = z.string().transform((value) => {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const line of value.split(/\r?\n/)) {
    const term = line.trim().replace(/\s+/g, " ");
    const key = term.toLocaleLowerCase();
    if (!term || seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
  }

  return terms;
});

export const faqMutationSchema = z.object({
  question: z.string().trim().min(1, "Enter the visitor question."),
  answer: z.string().trim().min(1, "Enter the approved answer."),
  alternativeWording: normalizedTerms,
  keywords: normalizedTerms,
  category: z
    .string()
    .trim()
    .max(100, "Category must be 100 characters or fewer.")
    .transform((value) => value || null),
});

export type FaqMutationInput = z.output<typeof faqMutationSchema>;

function stringValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function readFaqForm(formData: FormData) {
  const values: FaqFormValues = {
    question: stringValue(formData, "question"),
    answer: stringValue(formData, "answer"),
    alternativeWording: stringValue(formData, "alternativeWording"),
    keywords: stringValue(formData, "keywords"),
    category: stringValue(formData, "category"),
  };

  return { values, result: faqMutationSchema.safeParse(values) };
}

export function firstFaqValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the FAQ knowledge fields.";
}
