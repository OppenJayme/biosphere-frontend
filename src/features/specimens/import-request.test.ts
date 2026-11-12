/** Approved client transport seam; only the remote Server Action is mocked. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./import-actions", () => ({ commitSpecimenImportAction: vi.fn() }));

import { commitSpecimenImportAction } from "./import-actions";
import { requestSpecimenImportCommit } from "./import-request";

const reviewed = { previewId: "10000000-0000-4000-8000-000000000013", rowNumbers: [2, 4] };

beforeEach(() => vi.resetAllMocks());

describe("reviewed import client transport", () => {
  it("reports an interrupted commit as unknown without exposing transport details or retrying", async () => {
    vi.mocked(commitSpecimenImportAction).mockRejectedValueOnce(new TypeError("Failed to fetch: private diagnostic"));

    await expect(requestSpecimenImportCommit(reviewed)).resolves.toEqual({
      ok: false,
      message: "The import outcome could not be confirmed. Your reviewed preview and selections are unchanged. Check your connection, then retry this same preview before starting a new import.",
    });
    expect(commitSpecimenImportAction).toHaveBeenCalledExactlyOnceWith({
      previewId: "10000000-0000-4000-8000-000000000013",
      rowNumbers: [2, 4],
    });
  });

  it("preserves a resolved backend rejection rather than replacing it with transport wording", async () => {
    const rejected = { ok: false as const, message: "This preview expired or is no longer available. Upload the file again." };
    vi.mocked(commitSpecimenImportAction).mockResolvedValueOnce(rejected);

    expect(await requestSpecimenImportCommit(reviewed)).toEqual(rejected);
    expect(commitSpecimenImportAction).toHaveBeenCalledTimes(1);
  });

  it("preserves resolved import row results and counts without inventing success", async () => {
    const partial = {
      ok: true as const,
      data: {
        importBatchId: "20000000-0000-4000-8000-000000000013",
        results: [{ rowNumber: 4, success: false, errors: ["The selected collection is unavailable."] }],
        createdCount: 1,
        failedCount: 1,
      },
    };
    vi.mocked(commitSpecimenImportAction).mockResolvedValueOnce(partial);

    expect(await requestSpecimenImportCommit(reviewed)).toEqual(partial);
    expect(commitSpecimenImportAction).toHaveBeenCalledTimes(1);
  });

  it("preserves the reviewed preview and row identities across an explicit retry", async () => {
    const input = { previewId: reviewed.previewId, rowNumbers: [4, 2] };
    Object.freeze(input.rowNumbers);
    Object.freeze(input);
    const retryResult = {
      ok: true as const,
      data: {
        importBatchId: "20000000-0000-4000-8000-000000000013",
        results: [],
        createdCount: 0,
        failedCount: 0,
      },
    };
    vi.mocked(commitSpecimenImportAction)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(retryResult);

    expect((await requestSpecimenImportCommit(input)).ok).toBe(false);
    expect(commitSpecimenImportAction).toHaveBeenCalledTimes(1);
    expect(await requestSpecimenImportCommit(input)).toEqual(retryResult);
    expect(vi.mocked(commitSpecimenImportAction).mock.calls).toEqual([
      [{ previewId: "10000000-0000-4000-8000-000000000013", rowNumbers: [4, 2] }],
      [{ previewId: "10000000-0000-4000-8000-000000000013", rowNumbers: [4, 2] }],
    ]);
  });
});
