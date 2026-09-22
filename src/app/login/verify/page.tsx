import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { OtpInput } from "@/components/auth/OtpInput";
import { ResendCode } from "@/components/auth/ResendCode";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Verify Your Email",
};

export default async function VerifyOtpPage({ searchParams }: PageProps<"/login/verify">) {
  const { email } = await searchParams;
  const emailLabel = typeof email === "string" && email ? email : "your email address";

  return (
    <AuthLayout
      title="Verify your email"
      description={`We've sent a 6-digit verification code to ${emailLabel}. Enter it below.`}
    >
      <form className="space-y-6">
        <div>
          <p className="text-xs font-medium text-zinc-700">OTP Code</p>
          <div className="mt-1.5">
            <OtpInput name="otp" />
          </div>
        </div>

        <Button type="submit" radius="lg" className="w-full">
          Verify OTP
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/login/forgot-password" className="font-medium text-sky-600 hover:text-sky-700">
            Change Email
          </Link>
          <ResendCode />
        </div>
      </form>
    </AuthLayout>
  );
}
