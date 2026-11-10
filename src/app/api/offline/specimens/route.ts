import { specimenListSchema } from "@/features/offline/schema";
import { ApiError, apiFetch } from "@/lib/api-client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await apiFetch<unknown>("/specimens", {
      method: "GET",
      cache: "no-store",
    });
    const validated = specimenListSchema.safeParse(result);
    if (!validated.success) {
      return Response.json(
        { message: "The backend returned invalid specimen data." },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(validated.data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status =
      error instanceof ApiError && error.status >= 400 && error.status < 500
        ? error.status
        : 502;
    return Response.json(
      {
        message:
          status === 401
            ? "Your session expired. Sign in again to refresh offline records."
            : "Specimen records could not be refreshed.",
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
