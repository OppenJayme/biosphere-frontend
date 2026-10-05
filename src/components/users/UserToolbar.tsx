import { SearchIcon, ChevronDownIcon } from "@/components/icons";
import { USER_ROLES, USER_STATUSES, type UserRoleFilter, type UserStatusFilter } from "@/features/user-accounts/types";

function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: T | "";
  options: readonly T[];
  onChange: (value: T | "") => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        aria-label={label}
        className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function UserToolbar({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: {
  search: string;
  role: UserRoleFilter;
  status: UserStatusFilter;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRoleFilter) => void;
  onStatusChange: (value: UserStatusFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
      <FilterSelect label="Filter by role" allLabel="All Roles" value={role} options={USER_ROLES} onChange={onRoleChange} />
      <FilterSelect
        label="Filter by status"
        allLabel="All Statuses"
        value={status}
        options={USER_STATUSES}
        onChange={onStatusChange}
      />
    </div>
  );
}
