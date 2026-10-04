/**
 * Turns the Reports page selections into a GenerateReportDto body. Mirrors
 * the backend's period and field rules so mistakes surface before a request,
 * and sends only the filters the chosen report accepts (the backend rejects
 * the rest with a 400).
 */

import type { ReportDefinition, ReportFormat, ReportPeriod } from "./types";

export type ReportFormState = {
  period: ReportPeriod;
  month: string;
  year: string;
  from: string;
  to: string;
  remarks: string;
  specimenStatus: string;
  category: string;
  kingdom: string;
  phylum: string;
  taxonClass: string;
  taxonOrder: string;
  family: string;
  genus: string;
  species: string;
  conditionClass: string;
  storageUnitId: string;
  includeDescendantUnits: boolean;
  publicDisplay: "" | "true" | "false";
  inquiryStatus: string;
  inquiryType: string;
  visitStatus: string;
  exhibitStatus: string;
  arEnabled: "" | "true" | "false";
};

export type ReportRequestBody = Record<string, string | number | boolean>;

export type ReportRequestResult =
  | { ok: true; body: ReportRequestBody }
  | { ok: false; error: string };

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CUSTOM_RANGE_DAYS = 3660;
const MAX_TEXT_LENGTH = 100;
const MAX_REMARKS_LENGTH = 5000;
const MUSEUM_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

const TEXT_FILTERS = [
  "category",
  "kingdom",
  "phylum",
  "taxonClass",
  "taxonOrder",
  "family",
  "genus",
  "species",
  "conditionClass",
  "inquiryType",
] as const;
const ENUM_FILTERS = [
  "specimenStatus",
  "inquiryStatus",
  "visitStatus",
  "exhibitStatus",
] as const;
const BOOLEAN_FILTERS = ["publicDisplay", "arEnabled"] as const;

const TEXT_FILTER_LABELS: Record<(typeof TEXT_FILTERS)[number], string> = {
  category: "Category",
  kingdom: "Kingdom",
  phylum: "Phylum",
  taxonClass: "Class",
  taxonOrder: "Order",
  family: "Family",
  genus: "Genus",
  species: "Species",
  conditionClass: "Condition",
  inquiryType: "Inquiry type",
};

/** Current month and year in museum (Philippine) time. */
export function museumToday(now = new Date()) {
  const local = new Date(now.getTime() + MUSEUM_UTC_OFFSET_MS).toISOString();
  return { month: local.slice(0, 7), year: local.slice(0, 4), date: local.slice(0, 10) };
}

export function initialReportFormState(
  definition: Pick<ReportDefinition, "periods">,
  now = new Date(),
): ReportFormState {
  const today = museumToday(now);
  return {
    period: definition.periods.includes("MONTHLY") ? "MONTHLY" : definition.periods[0],
    month: today.month,
    year: today.year,
    from: `${today.month}-01`,
    to: today.date,
    remarks: "",
    specimenStatus: "",
    category: "",
    kingdom: "",
    phylum: "",
    taxonClass: "",
    taxonOrder: "",
    family: "",
    genus: "",
    species: "",
    conditionClass: "",
    storageUnitId: "",
    includeDescendantUnits: true,
    publicDisplay: "",
    inquiryStatus: "",
    inquiryType: "",
    visitStatus: "",
    exhibitStatus: "",
    arEnabled: "",
  };
}

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function periodFields(state: ReportFormState): ReportRequestResult {
  switch (state.period) {
    case "MONTHLY":
      return MONTH_PATTERN.test(state.month)
        ? { ok: true, body: { period: "MONTHLY", month: state.month } }
        : { ok: false, error: "Choose the month to report on." };
    case "YEARLY": {
      const year = Number(state.year);
      return Number.isInteger(year) && year >= 1900 && year <= 9999
        ? { ok: true, body: { period: "YEARLY", year } }
        : { ok: false, error: "Enter a four-digit year, for example 2026." };
    }
    case "CUSTOM": {
      const from = validDate(state.from);
      const to = validDate(state.to);
      if (!from || !to) {
        return { ok: false, error: "Choose both a start and an end date." };
      }
      if (from > to) {
        return { ok: false, error: "The start date must not be after the end date." };
      }
      const days = (to.getTime() - from.getTime()) / 86_400_000 + 1;
      if (days > MAX_CUSTOM_RANGE_DAYS) {
        return { ok: false, error: "A custom report period can cover at most 10 years." };
      }
      return { ok: true, body: { period: "CUSTOM", from: state.from, to: state.to } };
    }
    case "ALL_TIME":
      return { ok: true, body: { period: "ALL_TIME" } };
  }
}

export function buildReportRequest(
  definition: ReportDefinition,
  format: ReportFormat,
  state: ReportFormState,
): ReportRequestResult {
  if (!definition.formats.includes(format)) {
    return {
      ok: false,
      error: `The ${definition.title} is not available as ${format}.`,
    };
  }
  if (!definition.periods.includes(state.period)) {
    return { ok: false, error: "Choose a reporting period this report supports." };
  }

  const period = periodFields(state);
  if (!period.ok) return period;

  const accepts = new Set(definition.filters);
  const body: ReportRequestBody = { type: definition.type, format, ...period.body };

  for (const key of TEXT_FILTERS) {
    const value = state[key].trim();
    if (!accepts.has(key) || !value) continue;
    if (value.length > MAX_TEXT_LENGTH) {
      return {
        ok: false,
        error: `${TEXT_FILTER_LABELS[key]} must be at most ${MAX_TEXT_LENGTH} characters.`,
      };
    }
    body[key] = value;
  }

  for (const key of ENUM_FILTERS) {
    if (accepts.has(key) && state[key]) body[key] = state[key];
  }

  for (const key of BOOLEAN_FILTERS) {
    if (accepts.has(key) && state[key]) body[key] = state[key] === "true";
  }

  if (accepts.has("storageUnitId") && state.storageUnitId) {
    if (!UUID_PATTERN.test(state.storageUnitId)) {
      return { ok: false, error: "Choose a storage location from the list." };
    }
    body.storageUnitId = state.storageUnitId;
    // Sub-locations are included by default; only send the opt-out.
    if (accepts.has("includeDescendantUnits") && !state.includeDescendantUnits) {
      body.includeDescendantUnits = false;
    }
  }

  const remarks = state.remarks.trim();
  if (accepts.has("remarks") && remarks) {
    if (remarks.length > MAX_REMARKS_LENGTH) {
      return {
        ok: false,
        error: `Remarks must be at most ${MAX_REMARKS_LENGTH.toLocaleString("en-US")} characters.`,
      };
    }
    body.remarks = remarks;
  }

  return { ok: true, body };
}

/** File name from a Content-Disposition header, with a safe fallback. */
export function attachmentFileName(header: string | null, fallback: string) {
  const match = header ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header) : null;
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]).replace(/[\\/]/g, "_");
  } catch {
    return match[1].replace(/[\\/]/g, "_");
  }
}
