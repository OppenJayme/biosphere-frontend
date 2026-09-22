import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpInput } from "@/components/auth/OtpInput";
import { ResendCode } from "@/components/auth/ResendCode";
import { Button } from "@/components/ui/Button";
import { verifyResetCode, resendResetCode } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Verify Your Email",
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_otp: "That code is incorrect or has expired. Please try again.",
};

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const { email, error } = await searchParams;

  if (!email) {
    redirect("/login/forgot-password");
  }

  return (
    <AuthLayout
      title="Verify your email"
      description={`We've sent a verification code to ${email}. Enter it below.`}
    >
      <form action={verifyResetCode} className="space-y-6">
        <input type="hidden" name="email" value={email} />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Something went wrong. Please try again."}
          </p>
        )}

        <div>
          <p className="text-xs font-medium text-zinc-700">OTP Code</p>
          <div className="mt-1.5">
            <OtpInput name="otp" length={8} />
          </div>
        </div>

        <Button type="submit" radius="lg" className="w-full">
          Verify OTP
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/login/forgot-password" className="font-medium text-sky-600 hover:text-sky-700">
            Change Email
          </Link>
          <ResendCode action={resendResetCode.bind(null, email)} />
        </div>
      </form>
    </AuthLayout>
  );
}
