"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "ready" | "invalid" | "submitting";

export function AcceptInviteClient() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Supabase's invite link puts tokens (or an error) in the URL hash, not
    // the query string — the hash never reaches the server (window.location
    // isn't available there either), so this can only be read post-mount.
    /* eslint-disable react-hooks/set-state-in-effect -- deriving state from
       a browser-only URL fragment on mount, not from React/props state. */
    const params = new URLSearchParams(window.location.hash.slice(1));

    const errorDescription = params.get("error_description");
    if (errorDescription) {
      setError(errorDescription);
      setStatus("invalid");
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("This invite link is missing or malformed.");
      setStatus("invalid");
      return;
    }
    /* eslint-enable react-hooks/set-state-in-effect */

    const supabase = createClient();
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (error) {
        setError(error.message);
        setStatus("invalid");
        return;
      }

      // Drop the tokens out of the visible URL/history now that they're consumed.
      window.history.replaceState(null, "", window.location.pathname);
      setStatus("ready");
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setStatus("ready");
      return;
    }

    // Don't leave this session live — require a fresh, normal login next.
    await supabase.auth.signOut();
    router.push("/login?success=invite_accepted");
  }

  if (status === "checking") {
    return (
      <AuthLayout title="Accept Invitation" description="Checking your invite link…">
        <p className="text-sm text-zinc-500">One moment.</p>
      </AuthLayout>
    );
  }

  if (status === "invalid") {
    return (
      <AuthLayout
        title="Invite link invalid"
        description="This invitation link is invalid or has expired."
      >
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
        <p className="mt-4 text-sm text-zinc-600">
          Ask whoever invited you to send a new invitation, then open the link straight from that
          email without forwarding it.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set Your Password" description="Choose a password to activate your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <PasswordField
          id="password"
          label="New Password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm New Password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <Button type="submit" radius="lg" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? "Setting Password…" : "Activate Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
