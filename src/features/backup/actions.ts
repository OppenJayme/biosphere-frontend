/** Authenticated Server Action for the curator's manual "Back up now" command. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { runBackupNow } from "./api";

export async function backupNowAction(): Promise<void> {
  if (!(await verifySession())) redirect("/login?from=/backup-history");

  let notice: string;
  try {
    const result = await runBackupNow();
    notice = result.status === "COMPLETED" ? "backup-completed" : "backup-failed";
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?from=/backup-history");
    notice =
      error instanceof ApiError && error.status === 409
        ? "backup-running"
        : error instanceof ApiError && error.status === 403
          ? "backup-forbidden"
          : "backup-unavailable";
  }

  revalidatePath("/backup-history");
  revalidatePath("/audit-logs");
  redirect(`/backup-history?notice=${notice}`);
}
