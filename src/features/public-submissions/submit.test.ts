import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmedReceipt = {
  id: "55555555-5555-4555-8555-555555555555",
  referenceCode: "55555555",
  status: "PENDING",
  submittedAt: "2026-10-28T01:00:00.000Z",
};

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://auth.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic-public-key");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://submissions.example.test");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("public submission outcome", () => {
  it("does not invent a confirmation when a successful HTTP response lacks a receipt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({}, { status: 201 })),
    );
    const { postPublicSubmission } = await import("./submit");

    expect(
      await postPublicSubmission("/inquiries", { name: "Synthetic visitor" }),
    ).toMatchObject({
      ok: false,
      outcome: "unknown",
      message: expect.stringContaining("couldn't confirm"),
      details: [],
    });
  });

  it.each(["transport", "server-error"])(
    "does not claim the request was rejected after %s",
    async (mode) => {
      const remote = vi.fn();
      if (mode === "transport")
        remote.mockRejectedValue(new TypeError("SYNTHETIC_TRANSPORT"));
      else
        remote.mockResolvedValue(
          Response.json({ message: "PRIVATE_SERVER_MARKER" }, { status: 503 }),
        );
      vi.stubGlobal("fetch", remote);
      const { postPublicSubmission } = await import("./submit");

      const result = await postPublicSubmission("/visit-requests", {
        name: "Synthetic visitor",
      });
      expect(result).toMatchObject({
        ok: false,
        outcome: "unknown",
        message: expect.stringContaining("may have received"),
        details: [],
      });
      expect(JSON.stringify(result)).not.toContain("PRIVATE_SERVER_MARKER");
      expect(remote).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    { referenceCode: "   " },
    { status: "" },
    { status: "APPROVED_BY_CURATOR" },
    { submittedAt: "not-a-date" },
  ])("does not confirm an invalid receipt field %j", async (invalidField) => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { ...confirmedReceipt, ...invalidField },
            { status: 201 },
          ),
        ),
    );
    const { postPublicSubmission } = await import("./submit");
    expect(await postPublicSubmission("/visit-requests", {})).toMatchObject({
      ok: false,
      outcome: "unknown",
    });
  });

  it.each(["/inquiries", "/visit-requests"] as const)(
    "preserves the real server receipt from %s",
    async (path) => {
      const remote = vi
        .fn()
        .mockResolvedValue(Response.json(confirmedReceipt, { status: 201 }));
      vi.stubGlobal("fetch", remote);
      const { postPublicSubmission } = await import("./submit");
      expect(
        await postPublicSubmission(path, { name: "Synthetic visitor" }),
      ).toEqual({ ok: true, receipt: confirmedReceipt });
      expect(remote).toHaveBeenCalledWith(
        `https://submissions.example.test${path}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"name":"Synthetic visitor"}',
        },
      );
      expect(remote).toHaveBeenCalledTimes(1);
    },
  );

  it.each([400, 429])(
    "keeps a known %s rejection distinct from an unknown result",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            Response.json(
              { message: ["Check the synthetic email field", 123] },
              { status },
            ),
          ),
      );
      const { postPublicSubmission } = await import("./submit");
      expect(await postPublicSubmission("/inquiries", {})).toMatchObject({
        ok: false,
        outcome: "rejected",
        details: status === 400 ? ["Check the synthetic email field"] : [],
      });
    },
  );

  it.each(["invalid-json", "body-interrupted"])(
    "retains uncertainty when the receipt is %s",
    async (mode) => {
      const body =
        mode === "invalid-json"
          ? "not-json"
          : new ReadableStream({
              start(controller) {
                controller.error(new Error("SYNTHETIC_BODY_LOSS"));
              },
            });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(body, { status: 201 })),
      );
      const { postPublicSubmission } = await import("./submit");
      expect(await postPublicSubmission("/inquiries", {})).toMatchObject({
        ok: false,
        outcome: "unknown",
      });
    },
  );
});
