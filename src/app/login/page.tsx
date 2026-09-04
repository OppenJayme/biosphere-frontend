import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordField } from "@/components/auth/PasswordField";
import { Field } from "@/components/ui/Field";
import { IconInput } from "@/components/ui/IconInput";
import { Button } from "@/components/ui/Button";
import { MailIcon, LockIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Curator Sign In",
};

export default function LoginPage() {
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
      <form className="space-y-5">
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
