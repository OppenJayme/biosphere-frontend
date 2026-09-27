import { beforeEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

const { getSpecimenPossibleDuplicates } = await import("./api");

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";

beforeEach(() => apiFetch.mockReset());

describe("getSpecimenPossibleDuplicates", () => {
  it("sends a new uncached request on every call, so a refresh re-runs the lookup", async () => {
    apiFetch
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ possibleDuplicates: [], duplicateCheckAvailable: true });

    await expect(getSpecimenPossibleDuplicates(SPECIMEN_ID)).rejects.toThrow("network");
    await expect(getSpecimenPossibleDuplicates(SPECIMEN_ID)).resolves.toEqual({
      possibleDuplicates: [],
      duplicateCheckAvailable: true,
    });

    expect(apiFetch).toHaveBeenCalledTimes(2);
    for (const call of apiFetch.mock.calls) {
      expect(call).toEqual([
        `/specimens/${SPECIMEN_ID}/possible-duplicates`,
        { method: "GET", cache: "no-store" },
      ]);
    }
  });
});
