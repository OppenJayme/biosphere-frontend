/**
 * Supabase sends an invite link to the project's Site URL instead of the requested
 * /login/accept-invite page whenever that page is not on its Redirect URLs allow list.
 * The tokens then arrive in the hash of a public page, which ignores them.
 */

export const ACCEPT_INVITE_PATH = "/login/accept-invite";

/** Where an invite hash belongs, or null when the hash is not from an invite link. */
export function inviteLinkTarget(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (params.get("type") !== "invite" || !params.get("access_token")) return null;
  // Keep the hash: it never reaches a server, and the accept-invite page reads it.
  return `${ACCEPT_INVITE_PATH}#${params.toString()}`;
}
