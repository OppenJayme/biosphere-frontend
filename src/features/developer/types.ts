/** Runtime contracts for the restricted Developer interface (SRS 4.2). */

import { z } from "zod";

export const ACCOUNT_STATUSES = ["ACTIVE", "INACTIVE"] as const;

// Mirrors SUPPORTED_AR_MODEL_FORMATS / MAX_AR_ASSET_SIZE_BYTES in the backend
// developer module. A plain .gltf can reference sibling files, so only
// single-file formats are deployable.
export const AR_MODEL_FORMATS = ["glb", "usdz"] as const;
export const AR_ASSET_MAX_BYTES = 50 * 1024 * 1024;

export const curatorAccountSchema = z.object({
  id: z.uuid(),
  authUserId: z.uuid(),
  fullName: z.string().min(1),
  role: z.literal("CURATOR"),
  status: z.enum(ACCOUNT_STATUSES),
  avatarPath: z.string().nullable().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const curatorAccountListSchema = z.array(curatorAccountSchema);

export const arAssetSchema = z.object({
  id: z.uuid(),
  exhibitId: z.uuid(),
  // A private storage path, never a public URL.
  modelUrl: z.string().min(1),
  modelFormat: z.enum(AR_MODEL_FORMATS),
  isEnabled: z.boolean(),
});

export const arAssetRemovedSchema = z.object({
  id: z.uuid(),
  removed: z.literal(true),
});

/**
 * GET /developer/ar-exhibits: curator-approved (deployable) exhibits, plus any
 * exhibit that still holds assets so they can be cleaned up. Public identity only.
 */
export const arExhibitSchema = z.object({
  id: z.uuid(),
  publicSlug: z.string().min(1),
  status: z.string().min(1),
  archived: z.boolean(),
  // false = cleanup-only: assets can be deactivated or removed, not activated or replaced.
  deployable: z.boolean(),
  commonName: z.string().nullable(),
  scientificName: z.string().nullable(),
  assets: z.array(arAssetSchema),
});

export const arExhibitListSchema = z.array(arExhibitSchema);

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type ArModelFormat = (typeof AR_MODEL_FORMATS)[number];
export type CuratorAccount = z.infer<typeof curatorAccountSchema>;
export type ArAsset = z.infer<typeof arAssetSchema>;
export type ArExhibit = z.infer<typeof arExhibitSchema>;
