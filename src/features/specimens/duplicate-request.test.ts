/** Client transport contract; the remote Server Action is the only mocked boundary. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ checkSpecimenDuplicatesAction: vi.fn() }));

import { checkSpecimenDuplicatesAction } from "./actions";
import { requestSpecimenDuplicateCheck } from "./duplicate-request";

const candidate = { commonName: "TEST transport specimen", scientificName: "Testus transportus" };

beforeEach(() => vi.resetAllMocks());

describe("duplicate warning client transport", () => {
  it("reports an interrupted request as unknown rather than rejecting or claiming no duplicates", async () => {
    vi.mocked(checkSpecimenDuplicatesAction).mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(requestSpecimenDuplicateCheck(candidate)).resolves.toEqual({ status: "unavailable" });
  });

  it("allows the same candidate to recover matching evidence on an explicit retry", async () => {
    vi.mocked(checkSpecimenDuplicatesAction)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        status: "found",
        duplicates: [{
          specimenId: "10000000-0000-4000-8000-000000000002",
          accessionNumber: null,
          scientificName: "Testus transportus",
          commonName: "TEST transport specimen",
          status: "UNCATALOGED",
          confidence: "MEDIUM",
          matchedFields: ["SCIENTIFIC_NAME", "COMMON_NAME"],
          differingFields: [],
          message: "Possible duplicate: matching scientific and common names.",
        }],
      });

    expect(await requestSpecimenDuplicateCheck(candidate)).toEqual({ status: "unavailable" });
    expect(await requestSpecimenDuplicateCheck(candidate)).toEqual({
      status: "found",
      duplicates: [{
        specimenId: "10000000-0000-4000-8000-000000000002",
        accessionNumber: null,
        scientificName: "Testus transportus",
        commonName: "TEST transport specimen",
        status: "UNCATALOGED",
        confidence: "MEDIUM",
        matchedFields: ["SCIENTIFIC_NAME", "COMMON_NAME"],
        differingFields: [],
        message: "Possible duplicate: matching scientific and common names.",
      }],
    });
  });

  it.each(["idle", "clear", "unavailable"] as const)("preserves the returned %s outcome", async (status) => {
    vi.mocked(checkSpecimenDuplicatesAction).mockResolvedValueOnce({ status });

    expect(await requestSpecimenDuplicateCheck(candidate)).toEqual({ status });
  });
});
