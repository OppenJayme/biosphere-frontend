import { z } from "zod";

export const currentUserProfileSchema = z.object({
  accountId: z.uuid(),
  email: z.string().nullable(),
  fullName: z.string().min(1),
  role: z.enum(["CURATOR", "DEVELOPER"]),
});

export type CurrentUserProfile = z.infer<typeof currentUserProfileSchema>;
