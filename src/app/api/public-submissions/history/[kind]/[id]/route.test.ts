import { beforeEach, describe, expect, it, vi } from "vitest";

const { inquiryHistory, visitHistory } = vi.hoisted(() => ({
  inquiryHistory: vi.fn(),
  visitHistory: vi.fn(),
}));
vi.mock("@/features/inquiries/api", () => ({ getInquiryHistory: inquiryHistory }));
vi.mock("@/features/visit-requests/api", () => ({ getVisitRequestHistory: visitHistory }));
vi.mock("@/lib/api-client", () => ({
  ApiError: class ApiError extends Error {
    constructor(public status: number, public body: unknown) {
      super("Backend request failed");
    }
  },
}));

import { ApiError } from "@/lib/api-client";
import { GET } from "./route";

const id = "11111111-1111-4111-8111-111111111111";
const entry = {
  id: "22222222-2222-4222-8222-222222222222",
  direction: "INBOUND",
  type: "VISITOR_REPLY",
  subject: "Re: Visit Request",
  message: "We will bring 25 visitors.",
  recipientEmail: null,
  deliveryResult: null,
  sentAt: "2026-11-16T10:00:00Z",
  recordedBy: null,
  createdAt: "2026-11-16T10:00:00Z",
};

async function request(kind: string, recordId = id) {
  return GET(new Request("https://museum.example.test/api/public-submissions/history"), {
    params: Promise.resolve({ kind, id: recordId }),
  });
}

beforeEach(() => vi.resetAllMocks());

describe("curator conversation refresh route", () => {
  it.each([
    ["visit", visitHistory, inquiryHistory],
    ["inquiry", inquiryHistory, visitHistory],
  ] as const)("fetches only the selected %s history without caching", async (kind, selected, other) => {
    selected.mockResolvedValueOnce([entry]);
    const response = await request(kind);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual([entry]);
    expect(selected).toHaveBeenCalledTimes(1);
    expect(selected).toHaveBeenCalledWith(id);
    expect(other).not.toHaveBeenCalled();
  });

  it.each([
    ["unknown", id],
    ["visit", "not-a-uuid"],
    ["inquiry", "../../secrets"],
  ])("rejects invalid route parameters before backend access", async (kind, recordId) => {
    const response = await request(kind, recordId);
    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(inquiryHistory).not.toHaveBeenCalled();
    expect(visitHistory).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404])("preserves safe backend authorization/not-found status %i", async (status) => {
    visitHistory.mockRejectedValueOnce(new ApiError(status, { message: "PRIVATE_BACKEND_DETAILS" }));
    const response = await request("visit");
    expect(response.status).toBe(status);
    expect(JSON.stringify(await response.json())).not.toContain("PRIVATE_BACKEND_DETAILS");
  });

  it("converts backend outages to a safe uncached error, not leaked provider details", async () => {
    visitHistory.mockRejectedValueOnce(new ApiError(503, { message: "PRIVATE_PROVIDER_DETAILS" }));
    const response = await request("visit");
    expect(response.status).toBe(502);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(JSON.stringify(await response.json())).not.toContain("PRIVATE_PROVIDER_DETAILS");
  });

  it("does not claim success if the backend throws unexpectedly", async () => {
    inquiryHistory.mockRejectedValueOnce(new Error("PRIVATE_DB_MESSAGE"));
    const response = await request("inquiry");
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("PRIVATE_DB_MESSAGE");
  });
});
