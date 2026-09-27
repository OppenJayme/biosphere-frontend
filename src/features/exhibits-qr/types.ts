import { z } from "zod";

export const EXHIBIT_STATUSES = ["UNPUBLISHED", "PUBLISHED", "DISABLED"] as const;
export const EXHIBIT_LAYOUTS = ["card-grid", "mobile-accordion"] as const;

const exhibitMediaSchema = z.object({
  id: z.uuid(),
  exhibitId: z.uuid(),
  mediaUrl: z.string().min(1),
  displayOrder: z.number().int().nonnegative(),
  caption: z.string().nullable(),
  isCover: z.boolean(),
});

export const curatorExhibitSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  createdBy: z.uuid(),
  publicSlug: z.string().min(1),
  interestingFacts: z.string().nullable(),
  publicDescription: z.string().nullable(),
  distribution: z.string().nullable(),
  diet: z.string().nullable(),
  layoutType: z.string().nullable(),
  status: z.enum(EXHIBIT_STATUSES),
  publishedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  media: z.array(exhibitMediaSchema).optional(),
});

export const curatorExhibitsSchema = z.array(curatorExhibitSchema);

export const publicExhibitSchema = z.object({
  publicSlug: z.string().min(1),
  interestingFacts: z.string().nullable(),
  publicDescription: z.string().nullable(),
  distribution: z.string().nullable(),
  diet: z.string().nullable(),
  layoutType: z.string().nullable(),
  media: z.array(
    z.object({
      mediaUrl: z.string().url(),
      displayOrder: z.number().int().nonnegative(),
      caption: z.string().nullable(),
      isCover: z.boolean(),
    }),
  ),
});

export const qrCodeInfoSchema = z.object({
  exhibitId: z.uuid(),
  publicSlug: z.string().min(1),
  publicUrl: z.string().url(),
});

export const createExhibitSchema = z.object({
  specimenId: z.uuid("Choose a cataloged specimen approved for public display."),
  publicSlug: z
    .string()
    .trim()
    .min(1, "Enter a public URL slug.")
    .max(255)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
  interestingFacts: z.string().trim().min(1).max(5000).nullable().optional(),
  publicDescription: z.string().trim().min(1).max(5000).nullable().optional(),
  distribution: z.string().trim().min(1).max(255).nullable().optional(),
  diet: z.string().trim().min(1).max(255).nullable().optional(),
  layoutType: z.enum(EXHIBIT_LAYOUTS).nullable().optional(),
});

export const updateExhibitSchema = createExhibitSchema
  .omit({ specimenId: true, publicSlug: true })
  .partial();

export type CuratorExhibit = z.infer<typeof curatorExhibitSchema>;
export type PublicExhibit = z.infer<typeof publicExhibitSchema>;
export type QrCodeInfo = z.infer<typeof qrCodeInfoSchema>;
export type CreateExhibitInput = z.infer<typeof createExhibitSchema>;
export type UpdateExhibitInput = z.infer<typeof updateExhibitSchema>;