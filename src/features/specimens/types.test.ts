import { describe, expect, it } from "vitest";
import { parseSpecimenListQuery, specimenListHref } from "./types";

describe("specimen catalog query handling", () => {
  it("keeps supported filters and creates a stable catalog URL", () => {
    const query = parseSpecimenListQuery({
      search: "  Philippine eagle  ",
      status: "CATALOGED",
      page: "3",
    });

    expect(query).toEqual({
      search: "Philippine eagle",
      status: "CATALOGED",
      page: 3,
    });
    expect(specimenListHref(query)).toBe(
      "/specimens?search=Philippine+eagle&status=CATALOGED&page=3",
    );
  });

  it("drops invalid URL input instead of forwarding it to the backend", () => {
    expect(
      parseSpecimenListQuery({
        search: "x".repeat(101),
        status: "DRAFT",
        page: "-4",
      }),
    ).toEqual({
      search: "x".repeat(100),
      status: null,
      page: 1,
    });
  });

  it("omits defaults from pagination links", () => {
    expect(specimenListHref({ search: "", status: null, page: 1 })).toBe("/specimens");
    expect(
      specimenListHref({ search: "frog", status: "UNCATALOGED", page: 2 }, 1),
    ).toBe("/specimens?search=frog&status=UNCATALOGED");
  });
});
