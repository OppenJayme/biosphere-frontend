import type { z } from "zod";

/** Validates a backend response, failing loudly instead of rendering an unexpected shape. */
export function parseResponse<T>(schema: z.ZodType<T>, response: unknown, what: string): T {
  const result = schema.safeParse(response);
  if (!result.success) throw new Error(`The backend returned an invalid ${what} response.`);
  return result.data;
}
