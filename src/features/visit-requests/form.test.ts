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
  visitorFirstName: ["Ana", "", ""],
  visitorLastName: ["Reyes", "", ""],
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
      visitors: [{ firstName: "Ana", lastName: "Reyes" }],
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
    if (!missingPlate.success) expect(missingPlate.errors.plateNumber).toMatch(/plate number/);

    const withVehicle = readVisitRequestForm(
      formData({ ...base, bringingVehicle: "true", plateNumber: "ABC 1234", carBrand: "Toyota", carType: "" }),
      TODAY,
    );
    expect(withVehicle.success && withVehicle.data.plateNumber).toBe("ABC 1234");

    const hiddenVehicle = readVisitRequestForm(formData({ ...base, plateNumber: "ABC 1234" }), TODAY);
    expect(hiddenVehicle.success && hiddenVehicle.data.plateNumber).toBeUndefined();
  });

  it("rejects more named visitors than the visitor count, and last names without first names", () => {
    const tooMany = readVisitRequestForm(
      formData({ ...base, visitorCount: "1", visitorFirstName: ["Ana", "Ben"], visitorLastName: ["", ""] }),
      TODAY,
    );
    expect(tooMany.success).toBe(false);
    if (!tooMany.success) expect(tooMany.errors.visitors).toMatch(/2 names but 1 visitor/);

    const lastOnly = readVisitRequestForm(
      formData({ ...base, visitorFirstName: [""], visitorLastName: ["Reyes"] }),
      TODAY,
    );
    expect(lastOnly.success).toBe(false);
    if (!lastOnly.success) expect(lastOnly.errors.visitors).toMatch(/first name/);
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
