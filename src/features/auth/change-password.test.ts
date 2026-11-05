import { describe, expect, it } from "vitest";
import { changePasswordErrorMessage, readChangePasswordForm } from "./change-password";

function form(currentPassword: string, newPassword: string, confirmPassword = newPassword) {
  const data = new FormData();
  data.set("currentPassword", currentPassword);
  data.set("newPassword", newPassword);
  data.set("confirmPassword", confirmPassword);
  return data;
}

describe("readChangePasswordForm", () => {
  it("accepts a valid change without trimming the passwords", () => {
    expect(readChangePasswordForm(form(" old-password ", " new-password "))).toEqual({
      success: true,
      data: { currentPassword: " old-password ", newPassword: " new-password " },
    });
  });

  it.each([
    ["a missing current password", form("", "new-password"), "Enter your current password."],
    ["a short password", form("old-password", "short"), "Password must be at least 8 characters"],
    ["an overlong password", form("old-password", "a".repeat(73)), "Password must be 72 characters or fewer"],
    ["a mismatch", form("old-password", "new-password", "other-password"), "Passwords do not match."],
    [
      "an unchanged password",
      form("same-password", "same-password"),
      "Choose a new password that differs from your current one.",
    ],
  ])("refuses %s", (_name, data, message) => {
    expect(readChangePasswordForm(data)).toEqual({ success: false, message });
  });
});

describe("changePasswordErrorMessage", () => {
  it("shows the backend's own reason for a refused change", () => {
    expect(
      changePasswordErrorMessage({ status: 400, body: { message: "Your current password is incorrect." } }),
    ).toBe("Your current password is incorrect.");
  });

  it("does not show a validation list as a sentence", () => {
    expect(changePasswordErrorMessage({ status: 400, body: { message: ["too short"] } })).toBe(
      "Check your passwords and try again.",
    );
  });

  it.each([
    [{ status: 401, body: null }, "Your session has expired. Sign in again."],
    [{ status: 429, body: null }, "Too many attempts. Wait a minute and try again."],
    [{ status: 503, body: null }, "Your password could not be changed. Check your connection and try again."],
    [null, "Your password could not be changed. Check your connection and try again."],
  ])("explains %j", (error, message) => {
    expect(changePasswordErrorMessage(error)).toBe(message);
  });
});
