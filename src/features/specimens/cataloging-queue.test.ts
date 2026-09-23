/** Contract tests for safe Cataloging queue URL state and fixed backend filters. */

import { describe, expect, it } from "vitest";
import {
  catalogingQueueHref,
  parseCatalogingQueueQuery,
  toSpecimenListQuery,
} from "./cataloging-queue";

describe("Cataloging queue query", () => {
  it("normalizes search and pagination without accepting arbitrary workflow status", () => {
    const query = parseCatalogingQueueQuery({
      search: "  Philippine eagle  ",
      page: "2",
      status: "CATALOGED",
    });

    expect(query).toEqual({ search: "Philippine eagle", page: 2 });
    expect(toSpecimenListQuery(query)).toMatchObject({
      search: "Philippine eagle",
      status: "UNCATALOGED",
      sortBy: "updatedAt",
      sortDirection: "desc",
      page: 2,
    });
    expect(catalogingQueueHref(query, 3)).toBe(
      "/cataloging?search=Philippine+eagle&page=3",
    );
  });

  it("bounds untrusted URL values and omits default pagination", () => {
    const query = parseCatalogingQueueQuery({ search: "x".repeat(150), page: "0" });

    expect(query.search).toHaveLength(100);
    expect(query.page).toBe(1);
    expect(catalogingQueueHref({ search: "", page: 1 })).toBe("/cataloging");
  });
});
