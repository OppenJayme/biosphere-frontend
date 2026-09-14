import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Holds the role/accountId the backend returned at login — Supabase's own
// session has no concept of either, since role lives in the backend's DB.
//
// SECURITY: this cookie is plain JSON, not signed or encrypted by Supabase,
// and can go stale (e.g. a role change elsewhere doesn't update it until the
// next login). Treat it as a UI hint ONLY — e.g. choosing which nav items to
// render. NEVER use it for route authorization, RBAC, or any sensitive
// decision. The only authoritative sources for that are the backend's
// verified token (verifySession/getAccessToken below) and the
// user_account.role it looks up server-side.
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

// UI hint only — see the warning on ACCOUNT_COOKIE_NAME above. Do not use
// this for authorization decisions.
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
