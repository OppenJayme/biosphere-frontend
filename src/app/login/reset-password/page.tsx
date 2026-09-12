import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { LockIcon } from "@/components/icons";
import { resetPassword } from "@/features/auth/actions";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Reset Password",
};

const ERROR_MESSAGES: Record<string, string> = {
  weak_password: "Password must be at least 8 characters.",
  mismatch: "Passwords do not match.",
  failed: "Couldn't reset your password. Please try again.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // Only reachable with a live (recovery-scoped) Supabase session — that's
  // what verifyResetCode establishes after a correct OTP.
  const user = await verifySession();
  if (!user) {
    redirect("/login/forgot-password");
  }

  return (
    <AuthLayout
      title="Set a New Password"
      description="Choose a new password for your account."
      footnote={
        <>
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          Authorized USC Biological Museum personnel only.
        </>
      }
    >
      <form action={resetPassword} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        <PasswordField
          id="password"
          name="password"
          label="New Password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm New Password"
          autoComplete="new-password"
          required
          minLength={8}
        />

        <Button type="submit" radius="lg" className="w-full">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
