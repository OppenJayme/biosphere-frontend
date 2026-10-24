/** Approved client seam; only the remote Server Action is mocked. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

vi.mock("./media-actions", () => ({ updateSpecimenMediaAction: vi.fn() }));

import { updateSpecimenMediaAction } from "./media-actions";
import { requestSpecimenMediaMetadataUpdate } from "./media-request";

const specimenId = "10000000-0000-4000-8000-000000000022";
const mediaId = "20000000-0000-4000-8000-000000000022";
const previous = { values: { caption: "Old caption", displayOrder: "0" } };

function editedForm() {
  const data = new FormData();
  data.set("caption", "  TEST unsaved caption  ");
  data.set("displayOrder", "17");
  return data;
}

beforeEach(() => vi.resetAllMocks());

describe("media metadata client transport", () => {
  it("retains submitted edits and reports an unknown outcome without retrying or exposing error details", async () => {
    vi.mocked(updateSpecimenMediaAction).mockRejectedValueOnce(new TypeError("Failed to fetch: private diagnostic"));
    const data = editedForm();

    await expect(requestSpecimenMediaMetadataUpdate(specimenId, mediaId, previous, data)).resolves.toEqual({
      values: { caption: "  TEST unsaved caption  ", displayOrder: "17" },
      message: "The metadata save outcome could not be confirmed. Your edits are retained here. Check your connection and review the current saved metadata in another tab before retrying. No automatic retry was made.",
    });
    expect(updateSpecimenMediaAction).toHaveBeenCalledExactlyOnceWith(specimenId, mediaId, previous, data);
    expect(previous.values).toEqual({ caption: "Old caption", displayOrder: "0" });
  });

  it("preserves server-returned field errors and authorization feedback", async () => {
    const rejected = {
      values: { caption: "Submitted caption", displayOrder: "-1" },
      errors: { displayOrder: ["Display order must be a whole number from 0 to 2147483647."] },
      message: "Check the media metadata before saving.",
    };
    vi.mocked(updateSpecimenMediaAction).mockResolvedValueOnce(rejected);
    expect(await requestSpecimenMediaMetadataUpdate(specimenId, mediaId, previous, editedForm())).toEqual(rejected);

    const forbidden = { values: previous.values, message: "You do not have permission to change specimen media." };
    vi.mocked(updateSpecimenMediaAction).mockResolvedValueOnce(forbidden);
    expect(await requestSpecimenMediaMetadataUpdate(specimenId, mediaId, previous, editedForm())).toEqual(forbidden);
  });

  it("retains intentional clearing and permits only an explicit caller retry", async () => {
    const cleared = new FormData();
    cleared.set("caption", "");
    cleared.set("displayOrder", "0");
    vi.mocked(updateSpecimenMediaAction).mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const failed = await requestSpecimenMediaMetadataUpdate(specimenId, mediaId, previous, cleared);
    expect(failed.values).toEqual({ caption: "", displayOrder: "0" });
    expect(updateSpecimenMediaAction).toHaveBeenCalledTimes(1);

    const response = { values: { caption: "", displayOrder: "0" }, message: "No changes were saved. Change the caption or display order and try again." };
    vi.mocked(updateSpecimenMediaAction).mockResolvedValueOnce(response);
    expect(await requestSpecimenMediaMetadataUpdate(specimenId, mediaId, failed, cleared)).toEqual(response);
    expect(updateSpecimenMediaAction).toHaveBeenLastCalledWith(specimenId, mediaId, failed, cleared);
  });

  it.each([
    "/specimens/10000000-0000-4000-8000-000000000022/media?media=updated",
    "/login?from=/specimens",
  ])("preserves framework navigation to %s instead of reporting a transport failure", async (destination) => {
    let navigation: unknown;
    try { redirect(destination); } catch (error) { navigation = error; }
    expect(navigation).toBeInstanceOf(Error);
    vi.mocked(updateSpecimenMediaAction).mockRejectedValueOnce(navigation);
    await expect(requestSpecimenMediaMetadataUpdate(specimenId, mediaId, previous, editedForm())).rejects.toBe(navigation);
    expect(updateSpecimenMediaAction).toHaveBeenCalledTimes(1);
  });
});
