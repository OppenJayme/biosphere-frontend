import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class extends Error {
    constructor(
      public status: number,
      public body: unknown,
    ) {
      super("API error");
    }
  },
}));
vi.mock("./api", () => ({ listSpecimenMedia: vi.fn(), getSpecimenMediaSignedUrl: vi.fn() }));

import { verifySession } from "@/lib/session";
import { ApiError } from "@/lib/api-client";
import { listSpecimenMedia, getSpecimenMediaSignedUrl } from "./api";
import { getSpecimenCoverPreview } from "./cover-preview-action";

const id = "11111111-1111-4111-8111-111111111111";
const mediaId = "22222222-2222-4222-8222-222222222222";
const cover = {
  id: mediaId,
  specimenId: id,
  storagePath: "private/internal.png",
  displayOrder: 1,
  caption: "Museum specimen",
  isCover: true,
  createdAt: "2026-10-06T00:00:00Z",
};
const signedUrl =
  "https://example.supabase.co/storage/v1/object/sign/private/image?token=temporary";

describe("protected Cataloging cover preview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(verifySession).mockResolvedValue({
      id: "curator",
      aud: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: "2026-10-06T00:00:00Z",
    });
    vi.mocked(listSpecimenMedia).mockResolvedValue([cover]);
    vi.mocked(getSpecimenMediaSignedUrl).mockResolvedValue({ mediaId, signedUrl, expiresIn: 300 });
  });

  it("signs only the marked cover and returns an exact presentation shape", async () => {
    vi.mocked(listSpecimenMedia).mockResolvedValue([{ ...cover, id, isCover: false }, cover]);
    expect(await getSpecimenCoverPreview(id)).toEqual({
      kind: "image",
      caption: cover.caption,
      signedUrl,
    });
    expect(getSpecimenMediaSignedUrl).toHaveBeenCalledExactlyOnceWith(
      id,
      mediaId,
      expect.any(AbortSignal),
    );
  });

  it("does not read private media without a verified session", async () => {
    vi.mocked(verifySession).mockResolvedValue(null);
    expect(await getSpecimenCoverPreview(id)).toMatchObject({
      kind: "error",
      message: expect.stringMatching(/session expired/),
    });
    expect(listSpecimenMedia).not.toHaveBeenCalled();
  });

  it("rejects malformed IDs before querying the backend", async () => {
    expect(await getSpecimenCoverPreview("bad-id")).toMatchObject({ kind: "error" });
    expect(listSpecimenMedia).not.toHaveBeenCalled();
  });

  it("keeps a placeholder when no cover is marked, even if other images exist", async () => {
    vi.mocked(listSpecimenMedia).mockResolvedValue([{ ...cover, isCover: false }]);
    expect(await getSpecimenCoverPreview(id)).toEqual({ kind: "empty" });
    expect(getSpecimenMediaSignedUrl).not.toHaveBeenCalled();
  });

  it("does not sign media returned for another specimen", async () => {
    vi.mocked(listSpecimenMedia).mockResolvedValue([{ ...cover, specimenId: mediaId }]);
    expect(await getSpecimenCoverPreview(id)).toEqual({ kind: "empty" });
    expect(getSpecimenMediaSignedUrl).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 500])(
    "handles backend %s without exposing its response",
    async (status) => {
      vi.mocked(listSpecimenMedia).mockRejectedValue(
        new ApiError(status, { secret: "not-for-client" }),
      );
      const result = await getSpecimenCoverPreview(id);
      expect(result.kind).toBe("error");
      expect(JSON.stringify(result)).not.toContain("not-for-client");
      expect(getSpecimenMediaSignedUrl).not.toHaveBeenCalled();
    },
  );

  it("handles expired/deleted signing targets and network timeouts safely", async () => {
    vi.mocked(getSpecimenMediaSignedUrl).mockRejectedValue(new Error("sensitive driver detail"));
    expect(await getSpecimenCoverPreview(id)).toEqual({
      kind: "error",
      message: "The cover image could not be loaded. Try again.",
    });
    vi.mocked(listSpecimenMedia).mockRejectedValue(new DOMException("timeout", "TimeoutError"));
    expect((await getSpecimenCoverPreview(id)).kind).toBe("error");
  });

  it("rejects a signed response for a different media record", async () => {
    vi.mocked(getSpecimenMediaSignedUrl).mockResolvedValue({
      mediaId: id,
      signedUrl,
      expiresIn: 300,
    });
    expect((await getSpecimenCoverPreview(id)).kind).toBe("error");
  });
});
