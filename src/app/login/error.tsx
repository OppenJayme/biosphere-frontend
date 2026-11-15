"use client";

import { WorkspaceError } from "@/components/ui/WorkspaceError";

// Catches an unexpected error on the sign-in, invitation and password-reset pages.
export default function LoginError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-50/60 p-5">
      <WorkspaceError
        error={error}
        retry={retry}
        title="This page could not be loaded"
        homeHref="/login"
        homeLabel="Back to sign in"
      >
        <p>Something went wrong while loading this page. Check your connection and try again.</p>
      </WorkspaceError>
    </main>
  );
}
