import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://users.test" } }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn().mockResolvedValue({ id: "synthetic-curator" }),
  getAccessToken: vi.fn().mockResolvedValue("synthetic-token"),
}));

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session";
import { updateCuratorStatusAction } from "./actions";
import { EMPTY_CURATOR_STATUS_STATE } from "./form";

const accountId = "11111111-1111-4111-8111-111111111111";

const account = {
  id: accountId,
  fullName: "Maria Santos",
  email: "maria@usc.edu.ph",
  status: "INACTIVE",
  inviteAccepted: true,
  lastSignInAt: null,
  createdAt: "2026-11-01T00:00:00.000Z",
};

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = { accountId, status: "INACTIVE", name: "Maria Santos", reason: "  Left the museum ", ...overrides };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const submit = (data: FormData) => updateCuratorStatusAction(EMPTY_CURATOR_STATUS_STATE, data);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.mocked(verifySession).mockResolvedValue({ id: "synthetic-curator" } as Awaited<ReturnType<typeof verifySession>>);
});

describe("updateCuratorStatusAction", () => {
  it("sends only the status and trimmed reason, then refreshes the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(account));
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form({ role: "DEVELOPER" }));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/user-accounts/${accountId}/status`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "INACTIVE", reason: "Left the museum" });
    expect(result.success).toBe("Maria Santos can no longer sign in.");
    expect(revalidatePath).toHaveBeenCalledWith("/users");
  });

  it("confirms an activation in its own words", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ...account, status: "ACTIVE" })));

    const result = await submit(form({ status: "ACTIVE" }));

    expect(result.success).toBe("Maria Santos can sign in again.");
  });

  it("requires a reason and keeps the form from reaching the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form({ reason: "   " }));

    expect(result.error).toBe("Enter a reason.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a reason longer than the backend allows", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form({ reason: "x".repeat(501) }));

    expect(result.error).toBe("Reason must be 500 characters or fewer.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["accountId", "not-a-uuid"],
    ["status", "SUSPENDED"],
  ])("refuses a tampered %s without calling the backend", async (field, value) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form({ [field]: value }));

    expect(result.message).toBe("This account could not be changed. Reload the page and try again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    vi.mocked(verifySession).mockResolvedValueOnce(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form());

    expect(result.message).toBe("Your session has expired. Sign in again.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "Your session has expired. Sign in again."],
    [403, "You cannot change the status of your own account."],
    [404, "This curator account no longer exists. Reload the page."],
    [409, "This account changed while saving. Reload the page and try again."],
    [429, "Too many requests. Wait a minute and try again."],
    [500, "The account status could not be changed. Try again."],
  ])("explains a %s from the backend and keeps the reason", async (status, message) => {
    const body = { message: "You cannot change the status of your own account." };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body, { status })));

    const result = await submit(form());

    expect(result.message).toBe(message);
    expect(result.reason).toBe("  Left the museum ");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
