"use server";
import { z } from "zod";
import { apiFetch, ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export async function changeReviewQuestion(id: string, command: string): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!(await verifySession())) return { ok: false, message: "Sign in again before reviewing questions." };
  const parsed = z.object({ id: z.uuid(), command: z.enum(["REVIEWED", "DISMISSED", "REMOVE"]) }).safeParse({ id, command });
  if (!parsed.success) return { ok: false, message: "Invalid review command. Reload this page." };
  try {
    const response = await apiFetch<unknown>(`/faq/review-queue/${parsed.data.id}`, {
      method: command === "REMOVE" ? "DELETE" : "PATCH",
      ...(command !== "REMOVE" ? { body: JSON.stringify({ status: parsed.data.command }) } : {}),
    });
    const success = command === "REMOVE" ? z.object({ removed: z.literal(true) }) : z.object({ updated: z.literal(true) });
    if (!success.safeParse(response).success) throw new Error("Unconfirmed response");
    return { ok: true };
  } catch (error) {
    const message = error instanceof ApiError && error.status === 403 ? "You do not have permission to review questions."
      : error instanceof ApiError && error.status === 401 ? "Your session expired. Sign in again."
      : error instanceof ApiError && error.status === 404 ? "This question was removed or expired. Reload the page."
      : "Change could not be confirmed. Reload the page to check its current state before retrying.";
    return { ok: false, message };
  }
}
