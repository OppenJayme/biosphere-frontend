import { describe, expect, it } from "vitest";
import {
  ADJUSTMENT_TYPE_OPTIONS,
  adjustmentTypeLabel,
  adjustQuantityFormSchema,
  changeConditionFormSchema,
  lotHistoryHref,
  lotNotesFormSchema,
  lotOperationErrorMessage,
  moveLotFormSchema,
  parseLotHistorySearch,
  readableLotMessage,
} from "./operations";

describe("historical adjustment compatibility", () => {
  it("labels temporary absence without offering it as a new write command", () => {
    expect(adjustmentTypeLabel("TEMPORARY_ABSENCE")).toBe("Temporary absence");
    expect(ADJUSTMENT_TYPE_OPTIONS.map((option) => option.value)).not.toContain("TEMPORARY_ABSENCE");
    const values = { direction: "decrease", quantity: "1", reason: "Synthetic unsupported command" };
    const schema = adjustQuantityFormSchema(4);
    expect(schema.safeParse({ ...values, adjustmentType: "REMOVAL" }).success).toBe(true);
    const result = schema.safeParse({ ...values, adjustmentType: "TEMPORARY_ABSENCE" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "adjustmentType")).toBe(true);
  });
});

const CURRENT_UNIT = "30000000-0000-4000-8000-000000000001";
const OTHER_UNIT = "30000000-0000-4000-8000-000000000002";

describe("lot movement form", () => {
  it("parses a partial move and blanks an empty reason", () => {
    expect(
      moveLotFormSchema(5, CURRENT_UNIT).parse({
        targetStorageUnitId: OTHER_UNIT,
        quantity: "2",
        reason: " ",
      }),
    ).toEqual({ targetStorageUnitId: OTHER_UNIT, quantity: 2, reason: null });
  });

  it("rejects the current location and quantities above the lot", () => {
    const schema = moveLotFormSchema(5, CURRENT_UNIT);
    expect(
      schema.safeParse({ targetStorageUnitId: CURRENT_UNIT, quantity: "1", reason: "" }).success,
    ).toBe(false);
    for (const quantity of ["0", "6", "1.5", ""]) {
      expect(
        schema.safeParse({ targetStorageUnitId: OTHER_UNIT, quantity, reason: "" }).success,
      ).toBe(false);
    }
  });
});

describe("lot condition-change form", () => {
  it("normalizes whitespace like the backend", () => {
    expect(
      changeConditionFormSchema(3, "Good").parse({
        targetConditionClass: "  Fair   - cracked ",
        quantity: "3",
        reason: "",
      }),
    ).toMatchObject({ targetConditionClass: "Fair - cracked", quantity: 3 });
  });

  it("treats a case-only change as unchanged", () => {
    expect(
      changeConditionFormSchema(3, "Good").safeParse({
        targetConditionClass: "good",
        quantity: "1",
        reason: "",
      }).success,
    ).toBe(false);
  });
});

describe("lot quantity-adjustment form", () => {
  const base = { direction: "decrease", reason: "Annual count" };

  it("signs the delta from the adjustment type and sends the expected quantity", () => {
    expect(
      adjustQuantityFormSchema(4).parse({ ...base, adjustmentType: "ADDITION", quantity: "3" }),
    ).toEqual({
      adjustmentType: "ADDITION",
      quantityDelta: 3,
      expectedQuantity: 4,
      reason: "Annual count",
    });
    expect(
      adjustQuantityFormSchema(4).parse({ ...base, adjustmentType: "DESTRUCTION", quantity: "4" })
        .quantityDelta,
    ).toBe(-4);
  });

  it("uses the chosen direction only for data corrections", () => {
    const schema = adjustQuantityFormSchema(4);
    expect(
      schema.parse({ ...base, adjustmentType: "DATA_CORRECTION", direction: "increase", quantity: "2" })
        .quantityDelta,
    ).toBe(2);
    expect(
      schema.parse({ ...base, adjustmentType: "REMOVAL", direction: "increase", quantity: "2" })
        .quantityDelta,
    ).toBe(-2);
  });

  it("rejects overdraws and a missing reason", () => {
    const schema = adjustQuantityFormSchema(4);
    expect(
      schema.safeParse({ ...base, adjustmentType: "REMOVAL", quantity: "5" }).success,
    ).toBe(false);
    expect(
      schema.safeParse({ ...base, adjustmentType: "ADDITION", quantity: "1", reason: "  " })
        .success,
    ).toBe(false);
  });
});

describe("lot notes form", () => {
  it("allows clearing notes but not an unchanged save", () => {
    expect(lotNotesFormSchema("Shelf A").parse({ storageNotes: " " })).toEqual({
      storageNotes: null,
    });
    expect(lotNotesFormSchema("Shelf A").safeParse({ storageNotes: "Shelf A " }).success).toBe(
      false,
    );
    expect(lotNotesFormSchema(null).safeParse({ storageNotes: "" }).success).toBe(false);
  });
});

describe("lot history search", () => {
  it("parses and round-trips filters", () => {
    const search = parseLotHistorySearch({ page: "2", type: "MOVEMENT" });
    expect(search).toEqual({ page: 2, transactionType: "MOVEMENT" });
    expect(lotHistoryHref("/specimens/x/lots", search, 3)).toBe(
      "/specimens/x/lots?type=MOVEMENT&page=3",
    );
    expect(parseLotHistorySearch({ page: "-1", type: "BOGUS" })).toEqual({
      page: 1,
      transactionType: undefined,
    });
  });
});

describe("lot operation errors", () => {
  it("surfaces curator-readable backend messages only", () => {
    expect(readableLotMessage({ message: "Quantity 5 exceeds the source lot quantity of 3." })).toBe(
      "Quantity 5 exceeds the source lot quantity of 3.",
    );
    expect(readableLotMessage({ message: ["quantityDelta must not be 0"] })).toBeNull();
    expect(
      readableLotMessage({ message: `Lot ${CURRENT_UNIT} not found for specimen` }),
    ).toBeNull();
  });

  it("maps stale-lot conflicts and network failures", () => {
    expect(lotOperationErrorMessage({ status: 409, body: null }, "adjust")).toMatch(/Reload/);
    expect(lotOperationErrorMessage(null, "move")).toMatch(/movement could not be saved/);
  });
});
