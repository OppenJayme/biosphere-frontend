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
import { resendCuratorInviteAction } from "./actions";
import { getDeveloperAccess } from "./session";

const PENDING = "11111111-1111-4111-8111-111111111111";

const pendingAccount = {
  id: PENDING,
  authUserId: "33333333-3333-4333-8333-333333333333",
  fullName: "Juan dela Cruz",
  role: "CURATOR",
  status: "ACTIVE",
  inviteAccepted: false,
  avatarPath: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

const resend = (id = PENDING) => resendCuratorInviteAction(id, {}, new FormData());

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.mocked(getDeveloperAccess).mockResolvedValue({ state: "developer" } as Awaited<
    ReturnType<typeof getDeveloperAccess>
  >);
});

describe("resendCuratorInviteAction", () => {
  it("posts to the resend route with no body and refreshes the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(pendingAccount));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resend();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/developer/curators/${PENDING}/resend-invitation`);
    expect(init.method).toBe("POST");
    expect(init.body).toBeUndefined();
    expect(result.success).toMatch(/new password-setup link was sent/);
    expect(revalidatePath).toHaveBeenCalledWith("/developer");
  });

  it("shows the backend's reason when the link was already opened", async () => {
    const message = 'This curator already opened their invitation link. Ask them to use "Forgot password".';
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message }, { status: 409 })));

    expect(await resend()).toEqual({ message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("explains an email delivery failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message: "x" }, { status: 503 })));

    expect((await resend()).message).toBe("The invitation email could not be sent. Try again later.");
  });

  it("does not call the backend with an invalid id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await resend("not-a-uuid")).message).toMatch(/identifier is invalid/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a signed-in account that is not a Developer", async () => {
    vi.mocked(getDeveloperAccess).mockResolvedValue({ state: "not-developer" } as Awaited<
      ReturnType<typeof getDeveloperAccess>
    >);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await resend()).message).toMatch(/not authorized/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
