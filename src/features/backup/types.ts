/** Runtime contracts shared by the protected backup-history page and API client. */

import { z } from "zod";

export const BACKUP_STATUSES = ["IN_PROGRESS", "COMPLETED", "FAILED"] as const;
export const BACKUP_PAGE_SIZES = [10, 25, 50, 100] as const;

const backupCreatorSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(1),
  role: z.enum(["CURATOR", "DEVELOPER"]),
});

export const backupHistoryEntrySchema = z.object({
  id: z.uuid(),
  creator: backupCreatorSchema.nullable(),
  backupType: z.string().min(1),
  status: z.enum(BACKUP_STATUSES),
  artifactAvailable: z.boolean(),
  startedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const backupHistoryPageSchema = z.object({
  items: z.array(backupHistoryEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

export type BackupStatus = (typeof BACKUP_STATUSES)[number];
export type BackupPageSize = (typeof BACKUP_PAGE_SIZES)[number];
export type BackupHistoryEntry = z.infer<typeof backupHistoryEntrySchema>;
export type BackupHistoryPage = z.infer<typeof backupHistoryPageSchema>;

export type BackupHistoryListQuery = {
  search: string;
  status: BackupStatus | "";
  backupType: string;
  fromDate: string;
  toDate: string;
  page: number;
  limit: BackupPageSize;
};
