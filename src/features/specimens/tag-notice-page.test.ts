/** Verify the protected Tags page distinguishes duplicate no-ops without changing persistence. */
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ ApiError: class extends Error {} }));
vi.mock("@/features/specimens/api", () => ({
  getSpecimen: vi.fn(), listSpecimenTags: vi.fn(), searchAvailableTags: vi.fn(),
}));
vi.mock("@/components/specimens/SpecimenTagManager", () => ({ SpecimenTagManager: () => null }));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
  redirect: () => { throw new Error("REDIRECT"); },
}));

import SpecimenTagsPage from "../../app/(curator)/specimens/[id]/tags/page";
import { verifySession } from "@/lib/session";
import { getSpecimen, listSpecimenTags, searchAvailableTags } from "./api";

const id = "11111111-1111-4111-8111-111111111111";

async function markup(tag?: string | string[]) {
  return renderToStaticMarkup(await SpecimenTagsPage({
    params: Promise.resolve({ id }), searchParams: Promise.resolve({ tag }),
  }));
}

describe("Cataloging tag outcome notices", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(verifySession).mockResolvedValue({
      id, aud: "authenticated", app_metadata: {}, user_metadata: {},
      created_at: "2026-10-07T00:00:00Z",
    });
    vi.mocked(getSpecimen).mockResolvedValue({
      id, collectionId: null, accessionNumber: null, specimenCategory: null,
      scientificName: null, commonName: "Test specimen", gender: null,
      classificationStatus: null, status: "UNCATALOGED", publicDisplay: false,
      remarks: null, createdBy: id, updatedBy: null, archivedBy: null, archivedAt: null,
      createdAt: "2026-10-07T00:00:00Z", updatedAt: "2026-10-07T00:00:00Z",
    });
    vi.mocked(listSpecimenTags).mockResolvedValue([]);
    vi.mocked(searchAvailableTags).mockResolvedValue([]);
  });

  it("uses explicit no-change wording and warning styling for an already-attached tag", async () => {
    const html = await markup("existing");
    expect(html).toContain("Already attached — no changes saved");
    expect(html).toContain("No duplicate relationship was created");
    expect(html).toContain("bg-amber-50");
    expect(html).not.toContain("bg-emerald-50");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-atomic="true"');
  });

  it.each(["attached", "changed", "detached"])("keeps success feedback for %s", async (outcome) => {
    const html = await markup(outcome);
    expect(html).toContain("bg-emerald-50");
    expect(html).not.toContain("Already attached");
    expect(html).not.toContain("bg-amber-50");
  });

  it.each([undefined, "unknown", "<script>alert(1)</script>"])("ignores unsupported outcome %s", async (outcome) => {
    const html = await markup(outcome);
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain("<script>");
  });

  it("uses only the first query value", async () => {
    expect(await markup(["existing", "attached"])).toContain("Already attached — no changes saved");
  });

  it("still requires a session before fetching protected records", async () => {
    vi.mocked(verifySession).mockResolvedValue(null);
    await expect(markup("existing")).rejects.toThrow("REDIRECT");
    expect(getSpecimen).not.toHaveBeenCalled();
    expect(listSpecimenTags).not.toHaveBeenCalled();
  });
});
