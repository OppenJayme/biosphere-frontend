import { describe, expect, it } from "vitest";
import { fieldErrors, readInviteCuratorForm } from "./form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("readInviteCuratorForm", () => {
  it("trims the name and normalizes the email", () => {
    const { result } = readInviteCuratorForm(form({ fullName: "  Juan dela Cruz ", email: " Juan@USC.edu.ph " }));
    expect(result.success && result.data).toEqual({ fullName: "Juan dela Cruz", email: "juan@usc.edu.ph" });
  });

  it("keeps what the curator typed so a failed submit can refill the form", () => {
    const { values } = readInviteCuratorForm(form({ fullName: "Juan", email: "bad" }));
    expect(values).toEqual({ fullName: "Juan", email: "bad" });
  });

  it("reports an error for each invalid field", () => {
    const { result } = readInviteCuratorForm(form({ fullName: "   ", email: "not-an-email" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(fieldErrors(result.error)).toEqual({
      fullName: "Enter the curator's full name.",
      email: "Enter a valid email address.",
    });
  });

  it("rejects a name longer than the backend allows", () => {
    const { result } = readInviteCuratorForm(form({ fullName: "x".repeat(256), email: "juan@usc.edu.ph" }));
    expect(result.success).toBe(false);
  });

  it("only sends the email and full name, never a role", () => {
    const { result } = readInviteCuratorForm(
      form({ fullName: "Juan", email: "juan@usc.edu.ph", role: "DEVELOPER" }),
    );
    expect(result.success && Object.keys(result.data).sort()).toEqual(["email", "fullName"]);
  });
});
