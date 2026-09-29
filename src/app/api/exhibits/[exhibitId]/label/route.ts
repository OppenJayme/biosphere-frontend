/** Same-origin, authenticated printable exhibit label (SVG). */

import { getExhibitLabel } from "@/features/exhibits-qr/qr-api";
import { guardExhibitRequest, imageResponse, qrErrorResponse } from "@/features/exhibits-qr/route-helpers";

export const runtime = "nodejs";

type ExhibitRouteContext = { params: Promise<{ exhibitId: string }> };

export async function GET(request: Request, context: ExhibitRouteContext) {
  const { exhibitId } = await context.params;
  const blocked = await guardExhibitRequest(request, exhibitId);
  if (blocked) return blocked;

  try {
    const file = await getExhibitLabel(exhibitId);
    return imageResponse(file, new URL(request.url).searchParams.get("download") === "1");
  } catch (error) {
    return qrErrorResponse(error);
  }
}
