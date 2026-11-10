import { describe, expect, it } from "vitest";
import { inviteLinkTarget } from "./invite-link";

describe("inviteLinkTarget", () => {
  it("sends an invite hash to the set-password page with its tokens", () => {
    const target = inviteLinkTarget("#access_token=abc&refresh_token=def&token_type=bearer&type=invite");
    expect(target).toBe("/login/accept-invite#access_token=abc&refresh_token=def&token_type=bearer&type=invite");
  });

  it("ignores hashes that are not invite links", () => {
    expect(inviteLinkTarget("")).toBeNull();
    expect(inviteLinkTarget("#main")).toBeNull();
    expect(inviteLinkTarget("#access_token=abc&type=recovery")).toBeNull();
  });

  it("ignores an invite hash without a token", () => {
    expect(inviteLinkTarget("#type=invite")).toBeNull();
  });
});
