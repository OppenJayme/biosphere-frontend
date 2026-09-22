import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field } from "@/components/ui/Field";
import { IconInput } from "@/components/ui/IconInput";
import { Button } from "@/components/ui/Button";
import { MailIcon, LockIcon } from "@/components/icons";
import { forgotPassword } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Forgot Password",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  session_expired: "That reset step expired. Request a new code.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Forgot Password"
      description="Enter the email address associated with your account. We'll send you a verification code to reset your password."
      footnote={
        <>
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          Authorized USC Biological Museum personnel only.
        </>
      }
    >
      <form action={forgotPassword} className="space-y-5">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        <Field label="Email Address" htmlFor="email">
          <IconInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            icon={<MailIcon className="h-4 w-4" />}
          />
        </Field>

        <div className="flex gap-3">
          <Button type="submit" radius="lg" className="flex-1">
            Send Verification Code
          </Button>
          <Button href="/login" variant="outline-forest" radius="lg" className="flex-1">
            Back to Login
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
