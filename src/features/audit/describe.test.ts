import { describe, expect, it } from "vitest";
import { auditDetailRows, describeAuditEntry, humanizeCode, moduleLabel } from "./describe";

const curator = { id: "d20a29e1-5062-4ce1-af1e-8afcb10c4188", fullName: "Maria Santos", role: "CURATOR" as const };

describe("audit entry wording", () => {
  it("describes sign-ins as a sentence", () => {
    expect(describeAuditEntry({ actor: curator, action: "LOGIN", details: { role: "CURATOR" }, result: "SUCCESS" })).toBe(
      "Maria Santos signed in.",
    );
    expect(
      describeAuditEntry({ actor: null, action: "LOGIN_DENIED", details: { reason: "INVALID_CREDENTIALS" }, result: "DENIED" }),
    ).toBe("A sign-in attempt was blocked (invalid credentials).");
  });

  it("names the page for access denials", () => {
    expect(
      describeAuditEntry({ actor: curator, action: "ACCESS_DENIED", details: { path: "/exhibits", role: "DEVELOPER" }, result: "DENIED" }),
    ).toBe("Maria Santos was blocked from QR Exhibits (developer accounts can't open it).");
  });

  it("turns action codes into verbs with the right article and outcome", () => {
    expect(describeAuditEntry({ actor: curator, action: "ARCHIVE_EXHIBIT", details: null, result: "SUCCESS" })).toBe(
      "Maria Santos archived the exhibit.",
    );
    expect(describeAuditEntry({ actor: curator, action: "CREATE_SPECIMEN_LOT", details: null, result: "SUCCESS" })).toBe(
      "Maria Santos created a specimen lot.",
    );
    expect(describeAuditEntry({ actor: curator, action: "ENABLE_EXHIBIT_AR", details: null, result: "FAILED" })).toBe(
      "Maria Santos tried to turn on AR for the exhibit, but it failed.",
    );
    expect(describeAuditEntry({ actor: curator, action: "UPDATE_STORAGE_UNIT", details: null, result: "DENIED" })).toBe(
      "Maria Santos was not allowed to update the storage unit.",
    );
    expect(describeAuditEntry({ actor: curator, action: "ADD_EXHIBIT_MEDIA", details: null, result: "SUCCESS" })).toBe(
      "Maria Santos added a photo or video to the exhibit.",
    );
  });

  it("attributes public submissions to a visitor and unknown codes stay readable", () => {
    expect(describeAuditEntry({ actor: null, action: "SUBMIT_INQUIRY", details: null, result: "SUCCESS" })).toBe(
      "A visitor sent a general inquiry.",
    );
    expect(describeAuditEntry({ actor: null, action: "MERGE", details: null, result: "SUCCESS" })).toBe(
      "The system: merge.",
    );
  });

  it("names the record when its label is known and adds the previous status", () => {
    const exhibitEntry = {
      actor: curator,
      action: "DISABLE_EXHIBIT",
      affectedRecordType: "exhibit",
      details: { previousStatus: "PUBLISHED" },
      result: "SUCCESS" as const,
    };
    expect(describeAuditEntry(exhibitEntry, "African Lion")).toBe(
      "Maria Santos disabled the exhibit “African Lion”. It was Published before.",
    );
    expect(describeAuditEntry(exhibitEntry)).toBe("Maria Santos disabled the exhibit. It was Published before.");
    expect(
      describeAuditEntry(
        { actor: curator, action: "ENABLE_EXHIBIT_AR", affectedRecordType: "exhibit", details: null, result: "SUCCESS" },
        "Gray Wolf",
      ),
    ).toBe("Maria Santos turned on AR for the exhibit “Gray Wolf”.");
    expect(
      describeAuditEntry(
        { actor: curator, action: "UPDATE_INQUIRY_STATUS", affectedRecordType: "inquiry", details: null, result: "SUCCESS" },
        "Juan Cruz",
      ),
    ).toBe("Maria Santos changed the status of the general inquiry from Juan Cruz.");
    expect(
      describeAuditEntry(
        { actor: curator, action: "UPDATE_STORAGE_UNIT", affectedRecordType: "storage_unit", details: null, result: "SUCCESS" },
        "Cabinet A",
      ),
    ).toBe("Maria Santos updated the storage location “Cabinet A”.");
  });

  it("never exposes identifiers or email addresses in detail rows", () => {
    expect(
      auditDetailRows({
        previousStatus: "DISABLED",
        assetIds: ["b672bd3e-43a6-4f59-a9a6-2f0b3c1d4e5f"],
        recordId: "78d589b9-da66-4318-ba80-36f4125dbb75",
        email: "curator@example.com",
        quantity: 12,
        reviewed: true,
        nested: { a: 1 },
        target: "78d589b9-da66-4318-ba80-36f4125dbb75",
      }),
    ).toEqual([
      { label: "Previous status", value: "Disabled" },
      { label: "Quantity", value: "12" },
      { label: "Reviewed", value: "Yes" },
    ]);
    expect(auditDetailRows("plain text")).toEqual([]);
  });

  it("keeps acronyms when humanizing codes", () => {
    expect(humanizeCode("UPDATE_EXHIBIT_AR_SELECTION")).toBe("update exhibit AR selection");
    expect(moduleLabel("visit-requests")).toBe("Visit requests");
    expect(moduleLabel("faq")).toBe("FAQ");
  });
});
