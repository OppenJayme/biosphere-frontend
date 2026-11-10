import { isValidElement, type ReactElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
const getSpecimenPossibleDuplicates = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  // Run the transition synchronously so the click handler can be observed without a DOM.
  useTransition: () => [false, (callback: () => void) => callback()],
}));
vi.mock("@/features/specimens/api", () => ({ getSpecimenPossibleDuplicates }));

const { DuplicateRecheckButton } = await import("./DuplicateRecheckButton");
const { SpecimenSavedDuplicates } = await import("./SpecimenSavedDuplicates");
const { SpecimenDuplicateList } = await import("./SpecimenDuplicateList");

const SPECIMEN_ID = "10000000-0000-4000-8000-000000000001";

const possibleDuplicate = {
  specimenId: "10000000-0000-4000-8000-000000000002",
  accessionNumber: "USCBM-001",
  scientificName: "Passer domesticus",
  commonName: "House sparrow",
  status: "UNCATALOGED",
  confidence: "HIGH",
  matchedFields: ["ACCESSION_NUMBER"],
  differingFields: [],
  message: "Accession number USCBM-001 is already used by another specimen.",
};

/** Collect the elements of one component type from an un-rendered element tree. */
function findElements(node: ReactNode, type: unknown): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap((child) => findElements(child, type));
  if (!isValidElement(node)) return [];

  const props = node.props as { children?: ReactNode };
  return [...(node.type === type ? [node] : []), ...findElements(props.children, type)];
}

beforeEach(() => {
  refresh.mockReset();
  getSpecimenPossibleDuplicates.mockReset();
});

describe("DuplicateRecheckButton", () => {
  it("refreshes the current route instead of navigating to the same URL", () => {
    const button = DuplicateRecheckButton() as ReactElement<{ onClick: () => void }>;

    button.props.onClick();

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe("SpecimenSavedDuplicates retry", () => {
  it("issues a new lookup on the refresh after a failed request", async () => {
    getSpecimenPossibleDuplicates
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        possibleDuplicates: [possibleDuplicate],
        duplicateCheckAvailable: true,
      });

    const failed = await SpecimenSavedDuplicates({ specimenId: SPECIMEN_ID, trigger: "created" });
    expect(findElements(failed, DuplicateRecheckButton)).toHaveLength(1);

    // What router.refresh() does: the Server Component renders again for the same URL.
    const retried = await SpecimenSavedDuplicates({ specimenId: SPECIMEN_ID, trigger: "created" });

    expect(getSpecimenPossibleDuplicates).toHaveBeenCalledTimes(2);
    expect(getSpecimenPossibleDuplicates).toHaveBeenNthCalledWith(2, SPECIMEN_ID);
    expect(findElements(retried, DuplicateRecheckButton)).toHaveLength(0);
    const [list] = findElements(retried, SpecimenDuplicateList);
    expect((list.props as { duplicates: unknown[] }).duplicates).toEqual([possibleDuplicate]);
  });

  it("offers the retry when the backend reports the check unavailable", async () => {
    getSpecimenPossibleDuplicates.mockResolvedValueOnce({
      possibleDuplicates: [],
      duplicateCheckAvailable: false,
    });

    const result = await SpecimenSavedDuplicates({
      specimenId: SPECIMEN_ID,
      trigger: "provenance",
    });

    expect(findElements(result, DuplicateRecheckButton)).toHaveLength(1);
  });
});
