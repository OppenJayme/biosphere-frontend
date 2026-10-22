"use client";

import { useFormStatus } from "react-dom";
import { backupNowAction } from "@/features/backup/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Backing up…" : "Back up now"}
    </button>
  );
}

/** Starts a manual backup; the page reloads with the result notice. */
export function BackupNowButton() {
  return (
    <form action={backupNowAction}>
      <SubmitButton />
    </form>
  );
}
