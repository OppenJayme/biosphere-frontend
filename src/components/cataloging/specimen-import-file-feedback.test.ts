/** Excel picker feedback must not replace native input or import validation behavior. */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/specimens/import-actions", () => ({ commitSpecimenImportAction: vi.fn() }));

import { SpecimenImportWorkspace } from "./SpecimenImportWorkspace";
import { CATALOGING_FILE_FEEDBACK_CLASSES } from "../../features/specimens/control-styles";

describe("Cataloging Excel picker feedback", () => {
  it("uses shared enabled hover, keyboard-focus and disabled file-button feedback", () => {
    const html = renderToStaticMarkup(createElement(SpecimenImportWorkspace));
    const input = html.match(/<input\b[^>]*type="file"[^>]*>/)?.[0];
    expect(input).toBeDefined();
    expect(input).toContain(CATALOGING_FILE_FEEDBACK_CLASSES);
    expect(input).toContain('accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"');
    expect(html).toContain('href="/templates/specimen-import-template.xlsx"');
    expect(input).toContain('required=""');
    expect(input).toContain('name="file"');
    expect(html).toContain("Preview file");
    expect(html).toContain("Specimens");
    expect(html).toContain("Text");
  });
});
