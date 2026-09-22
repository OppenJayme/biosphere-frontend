import { z } from "zod";

export const visitRequestSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.string(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  purpose: z.string(),
  preferredDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  visitorCount: z.number().int().nonnegative(),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]),
  createdAt: z.string().min(1),
});

export const visitRequestListSchema = z.array(visitRequestSchema);

export type VisitRequest = z.infer<typeof visitRequestSchema>;
