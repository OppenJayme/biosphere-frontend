/** Runtime contract for the protected user account list. */

import { z } from "zod";

/** Contract of the backend's GET /user-accounts. */
export const userAccountSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(1),
  email: z.string().nullable(),
  role: z.enum(["CURATOR", "DEVELOPER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  inviteAccepted: z.boolean(),
  lastSignInAt: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
});

export const userAccountListSchema = z.array(userAccountSchema);

export type UserAccount = z.infer<typeof userAccountSchema>;

export const USER_ROLES = ["Curator", "Developer"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export type UserRoleFilter = UserRole | "";

export const USER_STATUSES = ["Active", "Pending Invite", "Inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export type UserStatusFilter = UserStatus | "";

export const USER_PAGE_SIZES = [10, 25, 50] as const;
export type UserPageSize = (typeof USER_PAGE_SIZES)[number];

/** One curator or developer as the Users page shows it. */
export type AccountUser = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  isCurrentUser: boolean;
  lastSignIn: string | null;
  createdOn: string;
  createdOnFull: string;
  initials: string;
  color: string;
};

export type ActivityEntry = { id: string; description: string; timestamp: string; failed: boolean };

export type RecentActivityResult = { status: "ok"; items: ActivityEntry[] } | { status: "error"; message: string };
