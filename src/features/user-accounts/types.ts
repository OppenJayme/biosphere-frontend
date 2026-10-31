/** Runtime contract for the protected curator account list. */

import { z } from "zod";

/** Contract of the backend's GET /user-accounts (curator accounts only). */
export const userAccountSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(1),
  email: z.string().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  inviteAccepted: z.boolean(),
  lastSignInAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
});

export const userAccountListSchema = z.array(userAccountSchema);

export type UserAccount = z.infer<typeof userAccountSchema>;

export const USER_STATUSES = ["Active", "Pending Invite", "Inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export type UserStatusFilter = UserStatus | "";

export const USER_PAGE_SIZES = [10, 25, 50] as const;
export type UserPageSize = (typeof USER_PAGE_SIZES)[number];

/** One curator as the Users page shows it. */
export type AccountUser = {
  id: string;
  name: string;
  email: string | null;
  status: UserStatus;
  isCurrentUser: boolean;
  lastSignIn: string | null;
  /** Date only, for the table; the detail panel shows `lastSignIn` with the time. */
  lastSignInDate: string | null;
  createdOn: string;
  createdOnFull: string;
  initials: string;
  color: string;
};

export type ActivityEntry = { id: string; description: string; timestamp: string; failed: boolean };

export type RecentActivityResult = { status: "ok"; items: ActivityEntry[] } | { status: "error"; message: string };
