import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://developer.test" } }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn().mockResolvedValue({ id: "synthetic-developer" }),
  getAccessToken: vi.fn().mockResolvedValue("synthetic-token"),
}));
vi.mock("./session", () => ({
  getDeveloperAccess: vi.fn().mockResolvedValue({ state: "developer" }),
}));

import { revalidatePath } from "next/cache";
import { handOverCuratorAction } from "./actions";
import { getDeveloperAccess } from "./session";

const OUTGOING = "11111111-1111-4111-8111-111111111111";
const SUCCESSOR = "22222222-2222-4222-8222-222222222222";

const account = (id: string, fullName: string, status: "ACTIVE" | "INACTIVE") => ({
  id,
  authUserId: id.replace(/^1|^2/, "3"),
  fullName,
  role: "CURATOR",
  status,
  inviteAccepted: true,
  avatarPath: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-07T00:00:00.000Z",
});

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    outgoingCuratorId: OUTGOING,
    successorCuratorId: SUCCESSOR,
    authorizationReason: "  Retirement memo 2027-01 ",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const submit = (data: FormData) => handOverCuratorAction({}, data);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.mocked(getDeveloperAccess).mockResolvedValue({ state: "developer" } as Awaited<
    ReturnType<typeof getDeveloperAccess>
  >);
});

describe("handOverCuratorAction", () => {
  it("sends only the two accounts and the trimmed authorization, then refreshes the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        outgoing: account(OUTGOING, "Fidel Curator", "INACTIVE"),
        successor: account(SUCCESSOR, "Next Curator", "ACTIVE"),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await submit(form({ status: "INACTIVE" }));

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/developer/curators/handover");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      outgoingCuratorId: OUTGOING,
      successorCuratorId: SUCCESSOR,
      authorizationReason: "Retirement memo 2027-01",
    });
    expect(result).toEqual({
      success:
        "Handover recorded. Fidel Curator can no longer sign in, and Next Curator continues as curator.",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/developer");
  });

  it("shows the backend's reason when the successor is not set up yet", async () => {
    const message =
      "The successor has not finished setting up their account. They must accept the invitation and sign in before the handover.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message }, { status: 409 })));

    expect(await submit(form())).toEqual({ message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("says nothing changed when the backend fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "boom" }, { status: 500 })));

    expect((await submit(form())).message).toBe(
      "The handover could not be completed. No account was changed. Try again.",
    );
  });

  it("does not call the backend for a handover to the same account", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await submit(form({ successorCuratorId: OUTGOING }))).message).toMatch(/different curator/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a signed-in account that is not a Developer", async () => {
    vi.mocked(getDeveloperAccess).mockResolvedValue({ state: "not-developer" } as Awaited<
      ReturnType<typeof getDeveloperAccess>
    >);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await submit(form())).message).toMatch(/not authorized/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
