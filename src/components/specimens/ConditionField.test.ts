/** Server-rendered starting states; choosing options is checked in the browser, not here. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConditionField } from "./ConditionField";

function render(defaultValue: string, props: { required?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(ConditionField, {
      id: "condition",
      name: "conditionClass",
      defaultValue,
      emptyLabel: "All conditions",
      className: "control",
      ...props,
    }),
  );
}

describe("ConditionField", () => {
  it("offers the empty choice, the agreed list and Other", () => {
    const html = render("");
    expect(html).toContain('<option value="" selected="">All conditions</option>');
    for (const option of ["Excellent", "Good", "Fair", "Poor", "Critical"]) {
      expect(html).toContain(`<option value="${option}">${option}</option>`);
    }
    expect(html).toContain('<option value="__other__">Other…</option>');
    expect(html).not.toContain("<input");
  });

  it("submits a listed value from the select and shows it under the listed spelling", () => {
    const html = render("GOOD");
    expect(html).toContain('<select id="condition" name="conditionClass"');
    expect(html).toContain('<option value="Good" selected="">Good</option>');
    expect(html).not.toContain("<input");
  });

  it("keeps an unlisted value in the Other box, which alone submits", () => {
    const html = render("Fair - cracked");
    expect(html).toContain('<option value="__other__" selected="">Other…</option>');
    expect(html).not.toContain('<select id="condition" name=');
    expect(html).toMatch(/<input[^>]*name="conditionClass"[^>]*value="Fair - cracked"/);
    expect(html).toContain('aria-label="Other condition"');
  });

  it("requires the box as well as the select when the field is required", () => {
    const html = render("Fair - cracked", { required: true });
    expect(html).toMatch(/<select[^>]*required=""/);
    expect(html).toMatch(/<input[^>]*required=""/);
  });
});
