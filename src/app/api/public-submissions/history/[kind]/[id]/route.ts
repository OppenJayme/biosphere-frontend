/**
 * Narrow, authenticated same-origin history endpoint for the curator's open record.
 * The backend enforces curator permissions using the server-held session token.
 */
import { z } from "zod";
import { getInquiryHistory } from "@/features/inquiries/api";
import { getVisitRequestHistory } from "@/features/visit-requests/api";
import { ApiError } from "@/lib/api-client";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };
type Context = { params: Promise<{ kind: string; id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { kind, id } = await params;
  if ((kind !== "inquiry" && kind !== "visit") || !z.uuid().safeParse(id).success) {
    return Response.json({ message: "Invalid history request." }, { status: 400, headers });
  }

  try {
    const history = kind === "inquiry" ? await getInquiryHistory(id) : await getVisitRequestHistory(id);
    return Response.json(history, { headers });
  } catch (error) {
    const status =
      error instanceof ApiError && [401, 403, 404].includes(error.status) ? error.status : 502;
    const message =
      status === 401
        ? "Your session expired. Sign in again."
        : status === 403
          ? "You cannot view this record."
          : status === 404
            ? "This record no longer exists."
            : "The conversation could not be refreshed.";
    return Response.json({ message }, { status, headers });
  }
}
