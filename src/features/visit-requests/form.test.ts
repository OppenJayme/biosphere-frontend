import { describe, expect, it } from "vitest";
import { readVisitRequestForm } from "./form";

const TODAY = "2026-09-29";

function formData(entries: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const base = {
  name: "Maria Santos",
  email: "maria@school.edu.ph",
  phone: "0917 123 4567",
  organization: "Cebu Science High",
  address: "",
  purpose: "Biology field trip",
  scheduleDate: ["2026-10-15", "2026-10-16"],
  scheduleStart: ["09:00", "13:00:00"],
  scheduleEnd: ["11:00", "15:00"],
  visitorCount: "3",
  visitorFirstName: ["Ana", "Ben", "Carla"],
  visitorLastName: ["Reyes", "Cruz", "Santos"],
  bringingVehicle: "false",
  equipment: "",
  notes: "",
  consent: "on",
};

describe("readVisitRequestForm", () => {
  it("builds the POST body with ordered schedules, named visitors, and no blank optionals", () => {
    const result = readVisitRequestForm(formData(base), TODAY);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(JSON.parse(JSON.stringify(result.data))).toEqual({
      name: "Maria Santos",
      email: "maria@school.edu.ph",
      phone: "0917 123 4567",
      organization: "Cebu Science High",
      purpose: "Biology field trip",
      visitorCount: 3,
      preferredSchedules: [
        { date: "2026-10-15", startTime: "09:00", endTime: "11:00" },
        { date: "2026-10-16", startTime: "13:00", endTime: "15:00" },
      ],
      visitors: [
        { firstName: "Ana", lastName: "Reyes" },
        { firstName: "Ben", lastName: "Cruz" },
        { firstName: "Carla", lastName: "Santos" },
      ],
      bringingVehicle: false,
      consentAccepted: true,
    });
  });

  it("requires a plate number when bringing a vehicle and drops vehicle fields otherwise", () => {
    const missingPlate = readVisitRequestForm(
      formData({ ...base, bringingVehicle: "true", plateNumber: " ", carBrand: "Toyota" }),
      TODAY,
    );
    expect(missingPlate.success).toBe(false);
    if (!missingPlate.success) expect(missingPlate.vehicleErrors[0]?.plateNumber).toMatch(/plate number/);

    const withVehicle = readVisitRequestForm(
      formData({ ...base, bringingVehicle: "true", plateNumber: "ABC 1234", carBrand: "Toyota", carType: "" }),
      TODAY,
    );
    expect(withVehicle.success && JSON.parse(JSON.stringify(withVehicle.data.vehicles))).toEqual([
      { plateNumber: "ABC 1234", carBrand: "Toyota" },
    ]);

    const hiddenVehicle = readVisitRequestForm(formData({ ...base, plateNumber: "ABC 1234" }), TODAY);
    expect(hiddenVehicle.success && hiddenVehicle.data.vehicles).toBeUndefined();
  });

  it("keeps each vehicle's details together and reports problems on the row they belong to", () => {
    const vehicles = {
      ...base,
      bringingVehicle: "true",
      plateNumber: ["ABC 1234", "XYZ 5678"],
      carBrand: ["Toyota", ""],
      carType: ["", "School Bus"],
    };

    const valid = readVisitRequestForm(formData(vehicles), TODAY);
    expect(valid.success && JSON.parse(JSON.stringify(valid.data.vehicles))).toEqual([
      { plateNumber: "ABC 1234", carBrand: "Toyota" },
      { plateNumber: "XYZ 5678", carType: "School Bus" },
    ]);

    const secondBlank = readVisitRequestForm(formData({ ...vehicles, plateNumber: ["ABC 1234", " "] }), TODAY);
    expect(secondBlank.success).toBe(false);
    if (secondBlank.success) return;
    expect(secondBlank.vehicleErrors).toEqual([{}, { plateNumber: expect.stringMatching(/plate number/) }]);

    const repeated = readVisitRequestForm(formData({ ...vehicles, plateNumber: ["ABC 1234", "abc-1234"] }), TODAY);
    expect(repeated.success).toBe(false);
    if (repeated.success) return;
    expect(repeated.vehicleErrors).toEqual([{}, { plateNumber: "This plate number is already listed." }]);
  });

  it("requires a first and last name for every visitor, one row per visitor", () => {
    const blanks = readVisitRequestForm(
      formData({ ...base, visitorFirstName: ["Ana", "", "Carla"], visitorLastName: ["Reyes", "", ""] }),
      TODAY,
    );
    expect(blanks.success).toBe(false);
    if (!blanks.success) {
      expect(blanks.visitorErrors).toEqual([
        undefined,
        "Enter this visitor's first and last name.",
        "Enter this visitor's last name.",
      ]);
      expect(blanks.errors.visitors).toMatch(/every visitor/);
    }

    const firstMissing = readVisitRequestForm(
      formData({ ...base, visitorFirstName: ["Ana", "Ben", " "], visitorLastName: ["Reyes", "Cruz", "Santos"] }),
      TODAY,
    );
    expect(!firstMissing.success && firstMissing.visitorErrors[2]).toBe("Enter this visitor's first name.");

    const tooFew = readVisitRequestForm(
      formData({ ...base, visitorFirstName: ["Ana"], visitorLastName: ["Reyes"] }),
      TODAY,
    );
    expect(!tooFew.success && tooFew.errors.visitors).toBe("Enter a first and last name for each of the 3 visitors.");

    const tooMany = readVisitRequestForm(
      formData({ ...base, visitorCount: "1", visitorFirstName: ["Ana", "Ben"], visitorLastName: ["Reyes", "Cruz"] }),
      TODAY,
    );
    expect(!tooMany.success && tooMany.errors.visitors).toBe("Enter a first and last name for each of the 1 visitor.");

    const noNames = readVisitRequestForm(
      formData({ ...base, visitorCount: "1", visitorFirstName: [], visitorLastName: [] }),
      TODAY,
    );
    expect(noNames.success).toBe(false);
  });

  it("caps name lengths to fit the 100-character visitor_name column", () => {
    const longFirst = readVisitRequestForm(
      formData({ ...base, visitorFirstName: ["A".repeat(51), "Ben", "Carla"] }),
      TODAY,
    );
    expect(!longFirst.success && longFirst.visitorErrors[0]).toMatch(/50 characters/);

    const longLast = readVisitRequestForm(
      formData({ ...base, visitorLastName: ["R".repeat(50), "Cruz", "Santos"] }),
      TODAY,
    );
    expect(!longLast.success && longLast.visitorErrors[0]).toMatch(/49 characters/);
  });

  it("limits plate numbers to 15 characters and car brand and type to 40", () => {
    const vehicle = { ...base, bringingVehicle: "true" };
    const atLimit = readVisitRequestForm(
      formData({ ...vehicle, plateNumber: "P".repeat(15), carBrand: "B".repeat(40), carType: "T".repeat(40) }),
      TODAY,
    );
    expect(atLimit.success).toBe(true);

    const overLimit = readVisitRequestForm(
      formData({ ...vehicle, plateNumber: "P".repeat(16), carBrand: "B".repeat(41), carType: "T".repeat(41) }),
      TODAY,
    );
    expect(!overLimit.success && overLimit.vehicleErrors[0]).toEqual({
      plateNumber: "Keep the plate number to 15 characters or fewer.",
      carBrand: "Keep the car brand to 40 characters or fewer.",
      carType: "Keep the car type to 40 characters or fewer.",
    });
  });

  it("accepts up to 200 visitors and rejects huge or non-numeric counts", () => {
    const names = (count: number) => ({
      visitorCount: String(count),
      visitorFirstName: Array.from({ length: count }, (_, index) => `Visitor${index}`),
      visitorLastName: Array.from({ length: count }, () => "Cruz"),
    });
    expect(readVisitRequestForm(formData({ ...base, ...names(200) }), TODAY).success).toBe(true);

    for (const visitorCount of ["201", "1e100", "0", "2.5", "abc"]) {
      const result = readVisitRequestForm(formData({ ...base, visitorCount }), TODAY);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors.visitorCount).toBeDefined();
    }
  });

  it("reports schedule problems per row and requires phone, organization, and consent", () => {
    const result = readVisitRequestForm(
      formData({
        ...base,
        phone: "",
        organization: "",
        consent: "",
        scheduleDate: ["2026-10-15", "2026-09-01"],
        visitorCount: "201",
      }),
      TODAY,
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.scheduleErrors).toEqual([undefined, expect.stringMatching(/today or a later/)]);
    expect(Object.keys(result.errors).sort()).toEqual(["consent", "organization", "phone", "visitorCount"]);
  });
});
