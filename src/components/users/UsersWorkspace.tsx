"use client";

import { useMemo, useState } from "react";
import { TablePagination } from "@/components/ui/TablePagination";
import { UserToolbar } from "./UserToolbar";
import { UserTable } from "./UserTable";
import { UserDetailPanel } from "./UserDetailPanel";
import {
  USER_PAGE_SIZES,
  type AccountUser,
  type UserPageSize,
  type UserStatusFilter,
} from "@/features/user-accounts/types";
import { filterUsers } from "@/features/user-accounts/view";

export function UsersWorkspace({ users }: { users: AccountUser[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatusFilter>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UserPageSize>(USER_PAGE_SIZES[0]);
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);

  const filtered = useMemo(() => filterUsers(users, { search, status }), [users, search, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const successors = useMemo(
    () => users.filter((u) => u.status === "Active" && !u.isCurrentUser),
    [users],
  );

  return (
    <div className="space-y-4">
      <UserToolbar
        search={search}
        status={status}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          {visible.length > 0 ? (
            <UserTable users={visible} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-500">
              {users.length === 0 ? "No curator accounts yet." : "No users match your search or filter."}
            </p>
          )}

          <TablePagination
            label="User pages"
            noun="users"
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size as UserPageSize);
              setPage(1);
            }}
          />
        </div>

        <UserDetailPanel user={selected} successors={successors} />
      </div>
    </div>
  );
}
