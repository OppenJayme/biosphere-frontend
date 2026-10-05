import { describe, expect, it } from "vitest";
import { buildCatalogingTrend, buildCollectionByType, buildStats, toQueueItem, toRecentRow } from "./summary";
import { dashboardSummarySchema, type DashboardSummary } from "./types";

const ROW = {
  id: "00000000-0000-4000-8000-000000000001",
  accessionNumber: null,
  scientificName: "Papilio polytes",
  commonName: null,
  specimenCategory: "Insect",
  status: "CATALOGED" as const,
  publicDisplay: true,
  storageLocation: "Room 101 › Cabinet A",
  condition: "Good",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return dashboardSummarySchema.parse({
    generatedAt: "2026-10-04T00:00:00.000Z",
    specimens: {
      total: 29,
      byStatus: { UNCATALOGED: 13, CATALOGED: 14, ARCHIVED: 2 },
      addedThisMonth: 3,
      possibleDuplicates: 2,
      byCategory: [
        { category: "Insect", count: 3 },
        { category: "Reptile", count: 1 },
      ],
      addedByMonth: [
        { month: "2025-11", count: 0 },
        { month: "2026-10", count: 3 },
      ],
    },
    submissions: { pendingInquiries: 2, pendingVisitRequests: 1 },
    exhibits: { total: 0, live: 0, publishedUnavailable: 0, unpublished: 0, disabled: 0, pending: [] },
    catalogingQueue: [],
    recentSpecimens: [ROW],
    ...overrides,
  });
}

describe("dashboard summary mapping", () => {
  it("shows every status count and links each card to its filtered list", () => {
    const stats = buildStats(summary());

    expect(stats.map((stat) => [stat.key, stat.value, stat.href])).toEqual([
      ["total", "29", "/specimens"],
      ["uncataloged", "13", "/specimens?status=UNCATALOGED"],
      ["cataloged", "14", "/specimens?status=CATALOGED"],
      ["archived", "2", "/specimens?status=ARCHIVED"],
      ["pending", "3", "/public-website?status=PENDING"],
      ["duplicates", "2", "/specimens?sortBy=scientificName&sortDirection=asc"],
    ]);
    expect(stats[0].note).toBe("+3 this month");
    expect(stats[4].note).toBe("2 inquiries · 1 visit request");
  });

  it("opens the visit-request tab when only visit requests are pending", () => {
    const stats = buildStats(summary({ submissions: { pendingInquiries: 0, pendingVisitRequests: 4 } }));
    expect(stats[4].href).toBe("/public-website?tab=visits&status=PENDING");
  });

  it("builds the category donut and month labels from the backend totals", () => {
    expect(buildCollectionByType(summary())).toEqual({
      total: 4,
      segments: [
        { label: "Insect", value: 3, pct: 75, color: "#c0392b" },
        { label: "Reptile", value: 1, pct: 25, color: "#c4922c" },
      ],
    });
    expect(buildCatalogingTrend(summary())).toEqual([
      { month: "Nov", value: 0 },
      { month: "Oct", value: 3 },
    ]);
  });

  it("maps queue and recent rows with fallbacks", () => {
    expect(toQueueItem(ROW)).toEqual({
      id: ROW.id,
      accessionNo: "Unassigned",
      species: "Papilio polytes",
      category: "Insect",
    });
    expect(toRecentRow(ROW)).toMatchObject({
      commonName: "Papilio polytes",
      storageLocation: "Room 101 › Cabinet A",
      catalogStatus: "Cataloged",
      publicStatus: "Public",
    });
  });
});
