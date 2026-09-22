import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
// Supabase's recovery-email token for this project is 8 digits, confirmed
// against a real send — not the 6 digits Supabase's docs generally imply.
export const otpSchema = z.string().regex(/^\d{8}$/, "Enter the 8-digit code");
export const newPasswordSchema = z.string().min(8, "Password must be at least 8 characters");
