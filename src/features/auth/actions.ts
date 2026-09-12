"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_COOKIE_NAME } from "@/lib/session";
import { login, type LoginResponse } from "./api";
import { emailSchema, otpSchema, newPasswordSchema } from "./schema";

export async function signIn(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const from = formData.get("from");
  const redirectTo = typeof from === "string" && from.startsWith("/") ? from : "/dashboard";

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    redirect(`/login?error=missing_fields`);
  }

  let session: LoginResponse;
  try {
    session = await login(email, password);
  } catch {
    redirect(`/login?error=invalid_credentials`);
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

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(ACCOUNT_COOKIE_NAME);

  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    redirect("/login/forgot-password?error=invalid_email");
  }
  const email = parsed.data;

  // Always move on to the verify step regardless of outcome — Supabase
  // responds the same way whether or not the account exists, so this form
  // can't be used to probe which emails are registered.
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email).catch(() => {});

  redirect(`/login/verify?email=${encodeURIComponent(email)}`);
}

export async function resendResetCode(email: string) {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email).catch(() => {});
}

export async function verifyResetCode(formData: FormData) {
  const email = formData.get("email");
  const parsedOtp = otpSchema.safeParse(formData.get("otp"));

  if (typeof email !== "string" || !email || !parsedOtp.success) {
    redirect(
      `/login/verify?email=${encodeURIComponent(typeof email === "string" ? email : "")}&error=invalid_otp`
    );
  }

  // Verifying the OTP against Supabase directly establishes a real (but
  // recovery-scoped) session via cookies — that's what lets the next step
  // call updateUser() without us having to invent our own reset token.
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

  if (!user) {
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

  const { error } = await supabase.auth.updateUser({ password: parsedPassword.data });
  if (error) {
    redirect("/login/reset-password?error=failed");
  }

  // Don't leave the recovery session live longer than it needs to be —
  // require a fresh, normal login with the new password from here.
  await supabase.auth.signOut();
  redirect("/login?success=password_reset");
}
