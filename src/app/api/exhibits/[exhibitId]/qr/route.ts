/** Same-origin, authenticated download of an exhibit's QR code (PNG or SVG). */

import { getExhibitQrCode, QR_DEFAULT_SIZE, QR_MAX_SIZE, QR_MIN_SIZE } from "@/features/exhibits-qr/qr-api";
import {
  guardExhibitRequest,
  imageResponse,
  json,
  qrErrorResponse,
} from "@/features/exhibits-qr/route-helpers";

export const runtime = "nodejs";

type ExhibitRouteContext = { params: Promise<{ exhibitId: string }> };

export async function GET(request: Request, context: ExhibitRouteContext) {
  const { exhibitId } = await context.params;
  const blocked = await guardExhibitRequest(request, exhibitId);
  if (blocked) return blocked;

  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "png";
  if (format !== "png" && format !== "svg") {
    return json({ message: "The QR format must be png or svg." }, 400);
  }
  const size = Number(params.get("size") ?? QR_DEFAULT_SIZE);
  if (!Number.isInteger(size) || size < QR_MIN_SIZE || size > QR_MAX_SIZE) {
    return json({ message: `The QR size must be ${QR_MIN_SIZE} to ${QR_MAX_SIZE} pixels.` }, 400);
  }

  try {
    const file = await getExhibitQrCode(exhibitId, format, size);
    return imageResponse(file, params.get("download") === "1");
  } catch (error) {
    return qrErrorResponse(error);
  }
}
