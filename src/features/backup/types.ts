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

export const backupPolicySchema = z.object({
  timeZone: z.string(),
  scheduleHours: z.array(z.number().int().min(0).max(23)),
  scheduleEnabled: z.boolean(),
  nextScheduledAt: z.string().nullable(),
  retention: z.object({
    keepAllHours: z.number().int().positive(),
    dailyDays: z.number().int().positive(),
    weeklyWeeks: z.number().int().positive(),
  }),
  targets: z.object({
    recoveryPointHours: z.number().positive(),
    recoveryTimeHours: z.number().positive(),
  }),
});

export type BackupPolicy = z.infer<typeof backupPolicySchema>;
