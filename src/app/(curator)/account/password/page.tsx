import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { PageHeader } from "@/components/curator/PageHeader";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Change Password",
};

export default async function ChangePasswordPage() {
  const user = await verifySession();
  if (!user) redirect("/login?from=/account/password");

  return (
    <div className="space-y-5">
      <PageHeader title="Change Password" description="Update the password you use to sign in to BioSphere." />
      <ChangePasswordForm />
    </div>
  );
}
