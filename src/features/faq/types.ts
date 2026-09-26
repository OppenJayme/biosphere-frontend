/** Runtime contracts for curator-controlled FAQ knowledge management. */

import { z } from "zod";

export const FAQ_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export const FAQ_PAGE_LIMIT = 25;

export const faqEntrySchema = z.object({
  id: z.uuid(),
  question: z.string().min(1),
  answer: z.string().min(1),
  alternativeWording: z.array(z.string()),
  keywords: z.array(z.string()),
  category: z.string().nullable(),
  status: z.enum(FAQ_STATUSES),
  createdBy: z.uuid(),
  updatedBy: z.uuid().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const faqEntryPageSchema = z.object({
  items: z.array(faqEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type FaqStatus = (typeof FAQ_STATUSES)[number];
export type FaqEntry = z.infer<typeof faqEntrySchema>;
export type FaqEntryPage = z.infer<typeof faqEntryPageSchema>;

export type FaqListQuery = {
  status: FaqStatus | "";
  category: string;
  page: number;
  limit: typeof FAQ_PAGE_LIMIT;
};
