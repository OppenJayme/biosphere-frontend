"use client";

import { useEffect } from "react";
import { inviteLinkTarget } from "@/features/auth/invite-link";

/** Forwards an invite link that landed on a public page to the set-password page. */
export function InviteLinkRedirect() {
  useEffect(() => {
    const target = inviteLinkTarget(window.location.hash);
    // replace(): the page holding the tokens stays out of the browser history.
    if (target) window.location.replace(target);
  }, []);

  return null;
}
