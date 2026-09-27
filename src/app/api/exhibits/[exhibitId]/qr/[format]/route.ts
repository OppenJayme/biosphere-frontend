import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiResponse } from "@/lib/api-client";

const formats = ["png", "svg"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ exhibitId: string; format: string }> },
) {
  const { exhibitId, format } = await params;
  const idResult = z.uuid().safeParse(exhibitId);
  if (!idResult.success || !formats.includes(format as (typeof formats)[number])) {
    return NextResponse.json({ message: "Invalid exhibit QR download." }, { status: 400 });
  }

  try {
    const upstream = await apiResponse(
      `/exhibits/${encodeURIComponent(idResult.data)}/qr/${format}`,
      { method: "GET", cache: "no-store" },
    );
    const contentType = format === "png" ? "image/png" : "image/svg+xml";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="exhibit-${idResult.data}-qr.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        error.body ?? { message: "The QR code could not be downloaded." },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "The QR code could not be downloaded. Check your connection and try again." },
      { status: 502 },
    );
  }
}
