/** Page-number window and footer text shared by the curator tables. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { pageNumbers, TablePagination } from "./TablePagination";

function footer(page: number, total: number, pageSize = 10) {
  return renderToStaticMarkup(
    createElement(TablePagination, {
      label: "Test pages",
      noun: "records",
      page,
      pageSize,
      total,
      hrefFor: (target: number) => `/list?page=${target}`,
      sizeHrefFor: (size: number) => `/list?limit=${size}`,
    }),
  );
}

describe("pageNumbers", () => {
  it("lists every page when there are few", () => {
    expect(pageNumbers(1, 1)).toEqual([1]);
    expect(pageNumbers(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("matches 1 2 3 4 5 … 10 at the start", () => {
    expect(pageNumbers(1, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
    expect(pageNumbers(4, 10)).toEqual([1, 2, 3, 4, 5, "gap", 10]);
  });

  it("keeps the current page and its neighbours visible in the middle", () => {
    expect(pageNumbers(6, 12)).toEqual([1, "gap", 5, 6, 7, "gap", 12]);
  });

  it("mirrors the start at the end", () => {
    expect(pageNumbers(10, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10]);
    expect(pageNumbers(7, 10)).toEqual([1, "gap", 6, 7, 8, 9, 10]);
  });
});

describe("TablePagination", () => {
  it("shows the requested range text", () => {
    expect(footer(1, 19)).toContain("Showing 1 to 10 of 19 records");
    expect(footer(2, 19)).toContain("Showing 11 to 19 of 19 records");
  });

  it("offers 10, 25 and 50 rows per page", () => {
    const html = footer(1, 19);
    for (const size of [10, 25, 50]) expect(html).toContain(`${size} / page`);
    expect(html).not.toContain("100 / page");
  });

  it("disables Previous on the first page and Next on the last by removing their links", () => {
    expect(footer(1, 19)).not.toContain('aria-label="Previous page"');
    expect(footer(1, 19)).toContain('aria-label="Next page"');
    expect(footer(2, 19)).not.toContain('aria-label="Next page"');
  });

  it("marks the current page and handles an empty list", () => {
    expect(footer(2, 19)).toContain('aria-current="page"');
    expect(footer(1, 0)).toContain("Showing 0 records");
  });
});
