"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api-client";
import { ACCOUNT_COOKIE_NAME, verifySession } from "@/lib/session";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { IDLE_COOKIE_NAME } from "@/lib/session-idle";
import {
  changePassword,
  completeOnboarding,
  login,
  requestPasswordRecovery,
  resetPasswordWithSession,
  type LoginResponse,
} from "./api";
import { changePasswordErrorMessage, readChangePasswordForm, type ChangePasswordState } from "./change-password";
import { LoginError } from "./login-error";
import { emailSchema, otpSchema, newPasswordSchema } from "./schema";

export async function signIn(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = getSafeRedirect(formData.get("from"));

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect(`/login?error=missing_fields`);
  }

  let session: LoginResponse;
  try {
    session = await login(email, password);
  } catch (error) {
    const code = error instanceof LoginError ? error.code : "server_unavailable";
    redirect(`/login?error=${code}`);
  }

  // Hand the backend-issued tokens to Supabase's own session management —
  // from here on, @supabase/ssr silently refreshes the session via cookies.
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  if (error) {
    redirect(`/login?error=invalid_credentials`);
  }

  // role/accountId aren't part of Supabase's session — the backend is the
  // only place that knows them, so stash what it returned at login.
  const cookieStore = await cookies();
  cookieStore.set(
    ACCOUNT_COOKIE_NAME,
    JSON.stringify({ accountId: session.user.accountId, role: session.user.role }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    }
  );
  // A stale value left by an earlier session must not end this one.
  cookieStore.delete(IDLE_COOKIE_NAME);

  redirect(redirectTo);
}

/**
 * Sets the invited curator's first password through the backend; see completeOnboarding.
 * Returns the message to show, or null on success.
 */
export async function completeOnboardingAction(accessToken: string, password: string): Promise<string | null> {
  const parsed = newPasswordSchema.safeParse(password);
  if (!parsed.success) return parsed.error.issues[0].message;
  if (typeof accessToken !== "string" || !accessToken) {
    return "This invite link is missing or malformed.";
  }

  const status = await completeOnboarding(accessToken, parsed.data);
  if (status === 200) return null;
  if (status === 400) return "That password can't be used. Choose a stronger one.";
  if (status === 429) return "Too many attempts. Wait a minute and try again.";
  return "Your password couldn't be saved. Try again in a moment.";
}

async function endSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_COOKIE_NAME);
  cookieStore.delete(IDLE_COOKIE_NAME);
}

export async function signOut() {
  await endSession();
  redirect("/login");
}

/** Called by InactivityGuard once the approved idle period has passed (REQ-4.1-05). */
export async function signOutInactive() {
  await endSession();
  redirect("/login?error=session_timeout");
}

/**
 * Changes the signed-in user's own password (REQ-4.1-16). The backend ends every session,
 * so a successful change always leads back to the sign-in page.
 */
export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  void _previousState;
  const parsed = readChangePasswordForm(formData);
  if (!parsed.success) return { message: parsed.message };
  if (!(await verifySession())) return { message: "Your session has expired. Sign in again." };

  try {
    await changePassword(parsed.data);
  } catch (error) {
    return { message: changePasswordErrorMessage(error instanceof ApiError ? error : null) };
  }

  await endSession();
  redirect("/login?success=password_changed");
}

export async function forgotPassword(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    redirect("/login/forgot-password?error=invalid_email");
  }
  const email = parsed.data;

  // Always move on to the verify step regardless of outcome — the backend
  // responds the same way whether or not the account exists, so this form
  // can't be used to probe which emails are registered.
  await requestPasswordRecovery(email);

  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

export async function resendResetCode(email: string) {
  // `email` comes back from a URL query param on the client — re-validate
  // it here rather than trusting it was never tampered with in transit.
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return;

  await requestPasswordRecovery(parsed.data);
}

export async function verifyResetCode(formData: FormData) {
  const rawEmail = formData.get("email");
  const parsedEmail = emailSchema.safeParse(rawEmail);
  const parsedOtp = otpSchema.safeParse(formData.get("otp"));

  if (!parsedEmail.success || !parsedOtp.success) {
    redirect(
      `/login/verify?email=${encodeURIComponent(typeof rawEmail === "string" ? rawEmail : "")}&error=invalid_otp`
    );
  }

  const email = parsedEmail.data;

  // Verifying the OTP against Supabase directly establishes a real (but
  // recovery-scoped) session via cookies — that's what the backend accepts
  // in the next step without us having to invent our own reset token.
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: parsedOtp.data,
    type: "recovery",
  });

  if (error) {
    redirect(`/login/verify?email=${encodeURIComponent(email)}&error=invalid_otp`);
  }

  redirect("/login/reset-password");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!user || !session) {
    redirect("/login/forgot-password?error=session_expired");
  }

  const password = formData.get("password");
  const confirmPasswordValue = formData.get("confirmPassword");
  const parsedPassword = newPasswordSchema.safeParse(password);

  if (!parsedPassword.success) {
    redirect("/login/reset-password?error=weak_password");
  }
  if (password !== confirmPasswordValue) {
    redirect("/login/reset-password?error=mismatch");
  }

  // The backend sets the password so the reset is audited and confirmed by
  // email (REQ-4.1-11, REQ-4.1-18). It also ends every session.
  const status = await resetPasswordWithSession(session.access_token, parsedPassword.data);
  if (status === 400) {
    redirect("/login/reset-password?error=weak_password");
  }
  if (status === 401 || status === 403) {
    redirect("/login/forgot-password?error=session_expired");
  }
  if (status !== 200) {
    redirect("/login/reset-password?error=failed");
  }

  // Clear this browser's copy too — a fresh, normal login comes next.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?success=password_reset");
}
