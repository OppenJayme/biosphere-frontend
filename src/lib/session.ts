import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Holds the role/accountId the backend returned at login — Supabase's own
// session has no concept of either, since role lives in the backend's DB.
export const ACCOUNT_COOKIE_NAME = "biosphere_account";

export type AccountInfo = {
  accountId: string;
  role: string;
};

// The real auth check — re-run in every Server Action / data-fetching function,
// since proxy.ts's cookie-presence check is only a cheap optimistic redirect
// and can drift out of sync with the routes it's meant to protect.
export async function verifySession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getAccessToken() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function getAccountInfo(): Promise<AccountInfo | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ACCOUNT_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AccountInfo;
  } catch {
    return null;
  }
}
