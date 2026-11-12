import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://curator.test" } }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn().mockResolvedValue({ id: "synthetic-curator" }),
  getAccessToken: vi.fn().mockResolvedValue("synthetic-token"),
}));
// The action module also imports the audit helpers, which reach other APIs.
vi.mock("../audit/api", () => ({ listAuditLogs: vi.fn() }));
vi.mock("../audit/record-labels", () => ({ resolveAuditRecordLabels: vi.fn() }));

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/session";
import { resendInvitationAction } from "./actions";

const PENDING = "11111111-1111-4111-8111-111111111111";

const pendingAccount = {
  id: PENDING,
  fullName: "Juan dela Cruz",
  email: "juan@usc.edu.ph",
  status: "ACTIVE",
  inviteAccepted: false,
  lastSignInAt: null,
  createdAt: "2026-11-01T00:00:00.000Z",
};

const resend = (id = PENDING) => resendInvitationAction(id, {}, new FormData());

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.mocked(verifySession).mockResolvedValue({ id: "synthetic-curator" } as Awaited<
    ReturnType<typeof verifySession>
  >);
});

describe("resendInvitationAction", () => {
  it("posts to the resend route and names the address the link went to", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(pendingAccount));
    vi.stubGlobal("fetch", fetchMock);

    const result = await resend();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`/user-accounts/${PENDING}/resend-invitation`);
    expect(init.method).toBe("POST");
    expect(result).toEqual({
      success: "A new password-setup link was sent to juan@usc.edu.ph. Earlier links no longer work.",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/users");
  });

  it("shows the backend's reason for a refusal", async () => {
    const message = "This curator has already accepted their invitation and can sign in.";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ message }, { status: 409 })));

    expect(await resend()).toEqual({ message });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("asks a signed-out curator to sign in without calling the backend", async () => {
    vi.mocked(verifySession).mockResolvedValue(null as Awaited<ReturnType<typeof verifySession>>);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await resend()).message).toMatch(/session has expired/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not call the backend with an invalid id", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect((await resend("not-a-uuid")).message).toBe("Unknown user account.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
