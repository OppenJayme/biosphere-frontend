"use client";

import type { CuratorUser, UserStatus } from "@/lib/dummy-data/users";

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: "bg-forest-100 text-forest-700",
  "Pending Invite": "bg-amber-100 text-amber-700",
  Inactive: "bg-red-100 text-red-600",
};

export function UserTable({
  users,
  selectedId,
  onSelect,
}: {
  users: CuratorUser[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Name</th>
            <th className="py-2 pr-3 font-medium">Role</th>
            <th className="py-2 pr-3 font-medium">Email</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Last Sign-in</th>
            <th className="py-2 pr-0 font-medium">Created On</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {users.map((user) => {
            const selected = user.id === selectedId;
            return (
              <tr
                key={user.id}
                onClick={() => onSelect(user.id)}
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${user.color}`}
                    >
                      {user.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="whitespace-nowrap font-medium text-zinc-900">{user.name}</p>
                      <p className="truncate text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{user.role}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{user.email}</td>
                <td className="py-2.5 pr-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[user.status]}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-500">{user.lastSignIn ?? "—"}</td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{user.createdOn}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
