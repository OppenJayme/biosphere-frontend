import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_API_URL: "http://faq.test" } }));
import { ReviewConsentForm } from "./FaqReviewConsent";
it("offers an unchecked explicit opt-in and warns about free-text personal data and retention", () => {
  const html = renderToStaticMarkup(createElement(ReviewConsentForm, { question: "Weekend workshops?" }));
  expect(html).toContain("Do not include names, contact details");
  expect(html).toContain("30 days");
  expect(html).toContain("No personal reply is promised");
  expect(html).toContain('type="checkbox"');
  expect(html).not.toContain('checked=""');
  expect(html).toContain('disabled=""');
  expect(html).toContain("Weekend workshops?");
});
