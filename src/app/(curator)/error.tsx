"use client";

import { WorkspaceError } from "@/components/ui/WorkspaceError";

// Catches an unexpected error on any curator page. It renders inside the curator layout, so the
// sidebar and top bar stay usable. An error in the layout itself goes to app/global-error.tsx.
export default function CuratorError({
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
      homeHref="/dashboard"
      homeLabel="Go to dashboard"
    >
      <p>Something went wrong while loading this page. Check your connection and try again.</p>
      <p>If you were saving a change, open the record and check it before saving again.</p>
    </WorkspaceError>
  );
}
