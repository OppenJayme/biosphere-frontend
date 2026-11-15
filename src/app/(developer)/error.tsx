"use client";

import { WorkspaceError } from "@/components/ui/WorkspaceError";

// Catches an unexpected error on a developer page, inside the developer layout's header.
export default function DeveloperError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <WorkspaceError
      error={error}
      retry={retry}
      title="This page could not be loaded"
      homeHref="/developer"
      homeLabel="Developer home"
    >
      <p>Something went wrong while loading this page. Check your connection and try again.</p>
      <p>If you were submitting a change, check whether it was applied before submitting again.</p>
    </WorkspaceError>
  );
}
