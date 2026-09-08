import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { UsersWorkspace } from "@/components/users/UsersWorkspace";
import { USERS, USER_FILTERS, USER_STATS } from "@/lib/dummy-data/users";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Users</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage curator accounts, access, and account status.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {USER_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <UsersWorkspace users={USERS} filters={USER_FILTERS} />
    </div>
  );
}
