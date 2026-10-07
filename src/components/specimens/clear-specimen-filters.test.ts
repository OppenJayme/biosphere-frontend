/** Transition contracts; actual request latency and browser history still need retesting. */
import { Children, createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pending: false,
  push: vi.fn(),
  transition: vi.fn((callback: () => void) => callback()),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useTransition: () => [mocks.pending, mocks.transition],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));

import { ClearSpecimenFiltersLink } from "./ClearSpecimenFiltersLink";

type LinkProps = {
  href: string;
  onNavigate: (event: { preventDefault: () => void }) => void;
};

function link() {
  return Children.toArray(ClearSpecimenFiltersLink().props.children)[0] as ReactElement<LinkProps>;
}

describe("Cataloging Clear all feedback", () => {
  beforeEach(() => {
    mocks.pending = false;
    vi.clearAllMocks();
  });

  it("keeps the native fixed href and shows no pending dialog while idle", () => {
    const html = renderToStaticMarkup(createElement(ClearSpecimenFiltersLink));
    expect(html).toContain('href="/specimens"');
    expect(html).toContain("Clear all");
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain('aria-disabled="true"');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("starts one navigation transition to the unfiltered route", () => {
    const preventDefault = vi.fn();
    link().props.onNavigate({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(mocks.transition).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/specimens");
  });

  it("shows busy text and an accessible non-blocking status while pending", () => {
    mocks.pending = true;
    const html = renderToStaticMarkup(createElement(ClearSpecimenFiltersLink));
    expect(html).toContain("Clearing filters…");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain("<dialog");
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading unfiltered specimen results…");
  });

  it("rejects additional navigations during pending work", () => {
    mocks.pending = true;
    const preventDefault = vi.fn();
    link().props.onNavigate({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("returns to idle feedback when the transition is no longer pending", () => {
    mocks.pending = true;
    expect(renderToStaticMarkup(createElement(ClearSpecimenFiltersLink))).toContain('role="status"');
    mocks.pending = false;
    const html = renderToStaticMarkup(createElement(ClearSpecimenFiltersLink));
    expect(html).not.toContain("<dialog");
    expect(html).not.toContain('role="status"');
    expect(html).toContain("Clear all");
  });
});
