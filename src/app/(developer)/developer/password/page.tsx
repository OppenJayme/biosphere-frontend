import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";

export const metadata: Metadata = {
  title: "Change Password",
};

export default function DeveloperChangePasswordPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Change password</h1>
        <p className="mt-1 text-sm text-zinc-600">Update the password you use to sign in to BioSphere.</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
