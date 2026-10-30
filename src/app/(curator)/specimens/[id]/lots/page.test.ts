/** Real page/API/schema/rendering with synthetic session and HTTP boundaries. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://lot-history.test" } }));
vi.mock("@/lib/session", () => ({
  verifySession: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue("synthetic-token"),
}));

import SpecimenLotsPage from "./page";
import { verifySession } from "@/lib/session";

const specimenId = "11111111-1111-4111-8111-111111111111";
const lotId = "22222222-2222-4222-8222-222222222222";
const actorId = "33333333-3333-4333-8333-333333333333";
const unitId = "44444444-4444-4444-8444-444444444444";
const stamp = "2026-10-31T00:00:00.000Z";
const specimen = {
  id: specimenId, collectionId: null, accessionNumber: "TEST-HISTORY-COMPAT",
  specimenCategory: null, scientificName: null, commonName: "Synthetic history specimen",
  gender: null, classificationStatus: null, status: "UNCATALOGED", publicDisplay: false,
  remarks: null, createdBy: actorId, updatedBy: null, archivedBy: null,
  archivedAt: null, createdAt: stamp, updatedAt: stamp,
};
const lot = {
  id: lotId, specimenId, storageUnitId: unitId, conditionClass: "Good", quantity: 4,
  storageNotes: null, isActive: true, createdBy: actorId, updatedBy: null,
  createdAt: stamp, updatedAt: stamp,
};
const historyEntry = {
  id: "55555555-5555-4555-8555-555555555555", sourceLotId: lotId, targetLotId: null,
  transactionType: "QUANTITY_ADJUSTMENT", quantityAffected: 1,
  adjustmentType: "TEMPORARY_ABSENCE", reason: "Synthetic retained history",
  performedBy: actorId, createdAt: stamp, specimenId,
  performedByName: "Synthetic curator", fromStorageUnitId: unitId,
  toStorageUnitId: null, fromConditionClass: "Good", toConditionClass: null,
};
let adjustmentType = "TEMPORARY_ABSENCE";
let historyStatus = 200;

describe("Lots page historical adjustment compatibility", () => {
  beforeEach(() => {
    adjustmentType = "TEMPORARY_ABSENCE";
    historyStatus = 200;
    vi.mocked(verifySession).mockResolvedValue({
      id: actorId, app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: stamp,
    });
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === `/specimens/${specimenId}`) return Response.json(specimen);
      if (url.pathname === `/specimens/${specimenId}/lots/summary`) {
        return Response.json({ specimenId, activeLotCount: 1, totalQuantity: 4 });
      }
      if (url.pathname === `/specimens/${specimenId}/lots`) return Response.json([lot]);
      if (url.pathname === `/specimens/${specimenId}/lots/history`) {
        if (historyStatus !== 200) return Response.json({ message: "PRIVATE_DATABASE_DETAIL" }, { status: historyStatus });
        return Response.json({ items: [{ ...historyEntry, adjustmentType }], total: 1, page: 1, limit: 25 });
      }
      if (url.pathname === "/storage-locations") {
        return Response.json({ items: [], total: 0, page: 1, limit: 100 });
      }
      throw new Error("Unexpected synthetic HTTP path");
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders existing lots and TEMPORARY_ABSENCE history without losing the page", async () => {
    const html = renderToStaticMarkup(await SpecimenLotsPage({
      params: Promise.resolve({ id: specimenId }), searchParams: Promise.resolve({}),
    }));
    expect(html).toContain("Lots and inventory history");
    expect(html).toContain("Temporary absence");
    expect(html).toContain("Synthetic retained history");
    expect(html).toContain("Total active quantity");
    expect(html).not.toContain("The specimen lots could not be loaded.");
  });

  it("continues rendering ordinary supported adjustments", async () => {
    adjustmentType = "ADDITION";
    const html = renderToStaticMarkup(await SpecimenLotsPage({ params: Promise.resolve({ id: specimenId }), searchParams: Promise.resolve({}) }));
    expect(html).toContain("Lots and inventory history");
    expect(html).toContain("Addition");
  });

  it("still rejects an unknown history category rather than silently accepting arbitrary values", async () => {
    adjustmentType = "UNRECOGNIZED_FUTURE_TYPE";
    const html = renderToStaticMarkup(await SpecimenLotsPage({ params: Promise.resolve({ id: specimenId }), searchParams: Promise.resolve({}) }));
    expect(html).toContain("The specimen lots could not be loaded.");
    expect(html).not.toContain("Synthetic retained history");
  });

  it("keeps the safe error state for a real backend failure without exposing its body", async () => {
    historyStatus = 500;
    const html = renderToStaticMarkup(await SpecimenLotsPage({ params: Promise.resolve({ id: specimenId }), searchParams: Promise.resolve({}) }));
    expect(html).toContain("The specimen lots could not be loaded.");
    expect(html).not.toContain("PRIVATE_DATABASE_DETAIL");
  });
});
