"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@/components/icons";
import { UserToolbar } from "./UserToolbar";
import { UserTable } from "./UserTable";
import { UserDetailPanel } from "./UserDetailPanel";
import { AddCuratorModal } from "./AddCuratorModal";
import type { CuratorUser, USER_FILTERS } from "@/lib/dummy-data/users";

const PAGE_SIZES = ["10 / page", "25 / page", "50 / page"];
const TOTAL_USERS = 48;
const PAGE_COUNT = 6;

export function UsersWorkspace({
  users,
  filters,
}: {
  users: CuratorUser[];
  filters: typeof USER_FILTERS;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(users[0]?.id ?? null);
  const [modalOpen, setModalOpen] = useState(false);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <UserToolbar filters={filters} onAddClick={() => setModalOpen(true)} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <UserTable users={users} selectedId={selectedId} onSelect={setSelectedId} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
            <p>
              Showing 1 to {users.length} of {TOTAL_USERS} users
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-sage-100"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`flex h-7 w-7 items-center justify-center rounded-md font-medium ${
                    page === 1 ? "border border-forest-700 text-forest-700" : "text-zinc-600 hover:bg-sage-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100">
                {PAGE_COUNT}
              </button>
              <button
                type="button"
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-sage-100"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <select
                defaultValue={PAGE_SIZES[0]}
                className="appearance-none rounded-md border border-black/15 bg-white py-1 pl-2.5 pr-7 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <UserDetailPanel user={selected} />
      </div>

      <AddCuratorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
