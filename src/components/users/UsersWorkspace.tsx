"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@/components/icons";
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          {visible.length > 0 ? (
            <UserTable users={visible} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-500">
              {users.length === 0 ? "No curator accounts yet." : "No users match your search or filter."}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
            <p>
              {filtered.length === 0
                ? "Showing 0 users"
                : `Showing ${start + 1} to ${start + visible.length} of ${filtered.length} users`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  aria-current={number === currentPage ? "page" : undefined}
                  onClick={() => setPage(number)}
                  className={`flex h-7 w-7 items-center justify-center rounded-md font-medium ${
                    number === currentPage ? "border border-forest-700 text-forest-700" : "text-zinc-600 hover:bg-sage-100"
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <select
                value={pageSize}
                aria-label="Users per page"
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as UserPageSize);
                  setPage(1);
                }}
                className="appearance-none rounded-md border border-black/15 bg-white py-1 pl-2.5 pr-7 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none"
              >
                {USER_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <UserDetailPanel user={selected} />
      </div>
    </div>
  );
}
