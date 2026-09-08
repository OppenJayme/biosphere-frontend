import "server-only";
import { createClient } from "@/lib/supabase/server";

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
