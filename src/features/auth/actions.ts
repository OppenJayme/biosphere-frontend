"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCOUNT_COOKIE_NAME } from "@/lib/session";
import { login, type LoginResponse } from "./api";

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
