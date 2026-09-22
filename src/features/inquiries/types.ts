import { z } from "zod";

export const inquirySchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  email: z.string(),
  phone: z.string().optional(),
  organization: z.string().optional(),
  address: z.string().optional(),
  message: z.string(),
  status: z.enum(["PENDING", "RESOLVED"]),
  createdAt: z.string().min(1),
});

export const inquiryListSchema = z.array(inquirySchema);

export type Inquiry = z.infer<typeof inquirySchema>;
