import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangleIcon } from "@/components/icons";
import { StatCard } from "@/components/ui/StatCard";
import { InviteCuratorDialog } from "@/components/users/InviteCuratorDialog";
import { UsersWorkspace } from "@/components/users/UsersWorkspace";
import { listUserAccounts } from "@/features/user-accounts/api";
import type { UserAccount } from "@/features/user-accounts/types";
import { buildUserStats, toAccountUser } from "@/features/user-accounts/view";
import { ApiError } from "@/lib/api-client";
import { getAccountInfo, verifySession } from "@/lib/session";
import { PageHeader } from "@/components/curator/PageHeader";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const user = await verifySession();
  if (!user) redirect("/login?from=/users");

  let accounts: UserAccount[] | null = null;
  try {
    accounts = await listUserAccounts();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?from=/users");
    }
    // Anything else (backend down, 403, bad payload) shows the error state below.
  }

  const account = await getAccountInfo();
  const users = accounts?.map((item) => toAccountUser(item, account?.accountId ?? null)) ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users"
        description="View and invite curator accounts, and check invitation status and recent activity."
        actions={<InviteCuratorDialog />}
      />

      {users ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {buildUserStats(users).map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <UsersWorkspace users={users} />
        </>
      ) : (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Curator accounts could not be loaded right now. Refresh the page or try again later.</p>
        </div>
      )}
    </div>
  );
}
