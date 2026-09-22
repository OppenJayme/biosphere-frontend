import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Field } from "@/components/ui/Field";
import { IconInput } from "@/components/ui/IconInput";
import { Button } from "@/components/ui/Button";
import { MailIcon, LockIcon } from "@/components/icons";
import { signIn } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Curator Sign In",
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Enter your email and password.",
  invalid_credentials: "Incorrect email or password.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  password_reset: "Your password has been reset. Sign in with your new password.",
  invite_accepted: "Your account is active. Sign in with your new password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string; success?: string }>;
}) {
  const { error, from, success } = await searchParams;

  return (
    <AuthLayout
      title="Curator Sign In"
      description="Enter your credentials to access the BioSphere Inventory System"
      footnote={
        <>
          <LockIcon className="h-3.5 w-3.5 shrink-0" />
          Authorized USC Biological Museum personnel only.
        </>
      }
    >
      <form action={signIn} className="space-y-5">
        {from && <input type="hidden" name="from" value={from} />}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        {success && SUCCESS_MESSAGES[success] && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {SUCCESS_MESSAGES[success]}
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

        <PasswordField id="password" name="password" autoComplete="current-password" required />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-zinc-700">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-4 w-4 rounded border-black/20 accent-forest-700"
            />
            Remember Me
          </label>
          <Link href="/login/forgot-password" className="font-medium text-sky-600 hover:text-sky-700">
            Forget Password ?
          </Link>
        </div>

        <Button type="submit" radius="lg" className="w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
