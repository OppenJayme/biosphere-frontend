/**
 * Form parsing for the restricted Developer interface.
 * The backend stays authoritative for roles, exhibit existence, and audit logging;
 * these checks only reject input the backend would refuse anyway, before it is sent.
 */

import { z } from "zod";
import {
  ACCOUNT_STATUSES,
  AR_ASSET_MAX_BYTES,
  AR_MODEL_FORMATS,
  type ArModelFormat,
} from "./types";

export const AR_ASSET_ACCEPT = AR_MODEL_FORMATS.map((format) => `.${format}`).join(",");
export const AUTHORIZATION_REASON_MAX_LENGTH = 500;

export type OnboardFormValues = { email: string; fullName: string };
export type OnboardFormState = { values: OnboardFormValues; message?: string; success?: string };
export type CuratorStatusFormState = { message?: string };

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function firstValidationMessage(error: z.ZodError, fallback = "Check the highlighted fields.") {
  return error.issues[0]?.message ?? fallback;
}

// ---- Curator onboarding (REQ-4.2-02) ----

const onboardCuratorSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  fullName: z
    .string()
    .trim()
    .min(1, "Enter the curator's full name.")
    .max(255, "Full name must be 255 characters or fewer."),
});

export type OnboardCuratorInput = z.output<typeof onboardCuratorSchema>;

export function readOnboardCuratorForm(formData: FormData) {
  const values: OnboardFormValues = {
    email: formString(formData, "email"),
    fullName: formString(formData, "fullName"),
  };
  return { values, result: onboardCuratorSchema.safeParse(values) };
}

// ---- Curator activation / deactivation (REQ-4.2-03) ----

const curatorStatusSchema = z.object({
  status: z.enum(ACCOUNT_STATUSES, "Choose whether to activate or deactivate the account."),
  authorizationReason: z
    .string()
    .trim()
    .min(1, "Record the formal authorization for this change.")
    .max(
      AUTHORIZATION_REASON_MAX_LENGTH,
      `The authorization note must be ${AUTHORIZATION_REASON_MAX_LENGTH} characters or fewer.`,
    ),
});

export type CuratorStatusInput = z.output<typeof curatorStatusSchema>;

export function readCuratorStatusForm(formData: FormData) {
  return curatorStatusSchema.safeParse({
    status: formString(formData, "status"),
    authorizationReason: formString(formData, "authorizationReason"),
  });
}

// ---- AR asset deployment (REQ-4.2-04, REQ-4.2-05) ----

function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "name" in value &&
    typeof (value as File).arrayBuffer === "function"
  );
}

export function fileExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

const modelFormatSchema = z.enum(AR_MODEL_FORMATS, "Choose the model format: GLB or USDZ.");

const authorizationConfirmedSchema = z.literal(
  "on",
  "Confirm that the curator approved this asset and its use is authorized.",
);

function arFileSchema(format: ArModelFormat | undefined) {
  return z
    .unknown()
    .superRefine((value, context) => {
      if (!isFile(value) || value.size === 0) {
        context.addIssue({ code: "custom", message: "Choose a non-empty AR model file." });
        return;
      }
      if (value.size > AR_ASSET_MAX_BYTES) {
        context.addIssue({ code: "custom", message: "The AR model must be 50 MB or smaller." });
      }
      const extension = fileExtension(value.name);
      if (!(AR_MODEL_FORMATS as readonly string[]).includes(extension)) {
        context.addIssue({ code: "custom", message: "Use a single-file .glb or .usdz model." });
      } else if (format && extension !== format) {
        context.addIssue({
          code: "custom",
          message: `The file is .${extension} but the selected format is ${format.toUpperCase()}.`,
        });
      }
    })
    .transform((value) => value as File);
}

function formatHint(formData: FormData): ArModelFormat | undefined {
  const parsed = modelFormatSchema.safeParse(formData.get("modelFormat"));
  return parsed.success ? parsed.data : undefined;
}

export function readArAssetCreateForm(formData: FormData) {
  return z
    .object({
      exhibitId: z.uuid("Enter the exhibit ID the curator approved for AR."),
      modelFormat: modelFormatSchema,
      file: arFileSchema(formatHint(formData)),
      authorizationConfirmed: authorizationConfirmedSchema,
      isEnabled: z.boolean(),
    })
    .safeParse({
      exhibitId: formString(formData, "exhibitId").trim(),
      modelFormat: formData.get("modelFormat"),
      file: formData.get("file"),
      authorizationConfirmed: formData.get("authorizationConfirmed"),
      isEnabled: formData.get("isEnabled") === "on",
    });
}

export function readArAssetReplaceForm(formData: FormData) {
  return z
    .object({
      assetId: z.uuid("The AR asset ID is invalid."),
      modelFormat: modelFormatSchema,
      file: arFileSchema(formatHint(formData)),
      authorizationConfirmed: authorizationConfirmedSchema,
    })
    .safeParse({
      assetId: formString(formData, "assetId").trim(),
      modelFormat: formData.get("modelFormat"),
      file: formData.get("file"),
      authorizationConfirmed: formData.get("authorizationConfirmed"),
    });
}

export type ArAssetCreateInput = Extract<ReturnType<typeof readArAssetCreateForm>, { success: true }>["data"];
export type ArAssetReplaceInput = Extract<ReturnType<typeof readArAssetReplaceForm>, { success: true }>["data"];

/**
 * Technical compatibility check (REQ-4.2-05): the file's leading bytes must match its
 * declared format. Binary glTF starts with the ASCII magic "glTF"; USDZ is an
 * uncompressed ZIP archive, which starts with a local file header "PK\x03\x04".
 */
export function matchesModelSignature(format: ArModelFormat, header: Uint8Array) {
  const signature = format === "glb" ? [0x67, 0x6c, 0x54, 0x46] : [0x50, 0x4b, 0x03, 0x04];
  return signature.every((byte, index) => header[index] === byte);
}

// The backend storage rules accept AR uploads only under these exact MIME types. Browsers
// usually report .glb/.usdz as "" or application/octet-stream, so the type is set from the
// validated format instead of trusting the browser.
const AR_MIME_TYPES: Record<ArModelFormat, string> = {
  glb: "model/gltf-binary",
  usdz: "model/vnd.usdz+zip",
};

function typedModelFile(file: File, format: ArModelFormat) {
  return new File([file], file.name, { type: AR_MIME_TYPES[format] });
}

/** Allowlisted multipart body for POST /developer/ar-assets; the authorization checkbox is UI-only. */
export function toCreateArAssetFormData(input: ArAssetCreateInput) {
  const body = new FormData();
  body.set("file", typedModelFile(input.file, input.modelFormat));
  body.set("exhibitId", input.exhibitId);
  body.set("modelFormat", input.modelFormat);
  body.set("isEnabled", String(input.isEnabled));
  return body;
}

/** Allowlisted multipart body for PATCH /developer/ar-assets/:id (file replacement). */
export function toReplaceArAssetFormData(input: ArAssetReplaceInput) {
  const body = new FormData();
  body.set("file", typedModelFile(input.file, input.modelFormat));
  body.set("modelFormat", input.modelFormat);
  return body;
}
