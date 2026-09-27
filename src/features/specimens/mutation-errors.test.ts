/**
 * Regression coverage for specimen mutation error copy, in particular that a 409 on an
 * edit means a concurrent change (backend SERIALIZABLE conflict) while a 409 on create
 * keeps its record-already-exists meaning.
 */

import { describe, expect, it } from "vitest";
import {
  concurrentChangeMessage,
  provenanceErrorMessage,
  specimenCoreErrorMessage,
  taxonomyErrorMessage,
} from "./mutation-errors";

const conflict = { status: 409, body: { message: "Specimen changed during the operation." } };
const reloadAndSave = "The specimen changed at the same time. Reload before saving again.";

describe("specimen mutation error messages", () => {
  it("builds the shared reload-and-retry message", () => {
    expect(concurrentChangeMessage("saving")).toBe(reloadAndSave);
    expect(concurrentChangeMessage("cataloging")).toBe(
      "The specimen changed at the same time. Reload before cataloging again.",
    );
  });

  describe.each([
    ["core", specimenCoreErrorMessage],
    ["taxonomy", taxonomyErrorMessage],
    ["provenance", provenanceErrorMessage],
  ] as const)("%s edits", (_name, message) => {
    it("explain a 409 on update as a concurrent change", () => {
      expect(message(conflict, "update")).toBe(reloadAndSave);
    });

    it("keep the Cataloged edit guard ahead of generic 400 copy", () => {
      const guard = {
        status: 400,
        body: {
          message:
            "Common name is required for a Cataloged specimen. Reopen cataloging before removing it.",
        },
      };
      expect(message(guard, "update")).toContain("Use “Reopen cataloging”");
    });

    it("fall back to a connection message when there is no API response", () => {
      expect(message(null, "update")).toContain("Check your connection");
    });
  });

  it("keeps the create-specific 409 messages", () => {
    expect(specimenCoreErrorMessage(conflict, "create")).toBe(
      "The specimen could not be saved because it conflicts with an existing record.",
    );
    expect(taxonomyErrorMessage(conflict, "create")).toBe(
      "A taxonomy record was already created for this specimen. Reload before editing it.",
    );
    expect(provenanceErrorMessage(conflict, "create")).toBe(
      "A provenance record was already created for this specimen. Reload before editing it.",
    );
  });
});
