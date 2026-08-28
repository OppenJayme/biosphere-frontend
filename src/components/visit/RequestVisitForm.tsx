"use client";

import { useState } from "react";
import { Field, FieldGroupLabel, fieldClasses } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, PlusIcon, CloseIcon } from "@/components/icons";

let visitorRowId = 0;
function nextVisitorRowId() {
  visitorRowId += 1;
  return visitorRowId;
}

export function RequestVisitForm({
  onCancel,
  onSubmitted,
}: {
  onCancel?: () => void;
  onSubmitted?: () => void;
}) {
  const [visitorRows, setVisitorRows] = useState<number[]>(() => [nextVisitorRowId()]);
  const [bringingVehicle, setBringingVehicle] = useState(false);

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        // No backend yet — features/visit-requests will wire this to a Server Action.
        onSubmitted?.();
      }}
    >
      <div className="space-y-4">
        <FieldGroupLabel>Contact Details</FieldGroupLabel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Person Name" htmlFor="visit-name">
            <input
              id="visit-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Juan Dela Cruz"
              required
              className={fieldClasses}
            />
          </Field>
          <Field label="Email Address" htmlFor="visit-email">
            <input
              id="visit-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@school.edu.ph"
              required
              className={fieldClasses}
            />
          </Field>
          <Field label="Contact Number" htmlFor="visit-phone">
            <input
              id="visit-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              className={fieldClasses}
            />
          </Field>
          <Field label="Organization / School" htmlFor="visit-org">
            <input
              id="visit-org"
              name="organization"
              type="text"
              placeholder="University of San Carlos"
              className={fieldClasses}
            />
          </Field>
        </div>

        <Field label="Purpose of Visit" htmlFor="visit-purpose">
          <textarea
            id="visit-purpose"
            name="purpose"
            rows={3}
            placeholder="Field trip, research, class requirement, etc."
            required
            className={fieldClasses}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <FieldGroupLabel>Schedule</FieldGroupLabel>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Preferred Date" htmlFor="visit-date">
            <input id="visit-date" name="date" type="date" required className={fieldClasses} />
          </Field>
          <Field label="Start Time" htmlFor="visit-start-time">
            <input id="visit-start-time" name="startTime" type="time" required className={fieldClasses} />
          </Field>
          <Field label="End Time" htmlFor="visit-end-time">
            <input id="visit-end-time" name="endTime" type="time" required className={fieldClasses} />
          </Field>
        </div>
      </div>

      <div className="space-y-4">
        <FieldGroupLabel>Visitors</FieldGroupLabel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Number of Visitors" htmlFor="visit-count">
            <input
              id="visit-count"
              name="visitorCount"
              type="number"
              min={1}
              defaultValue={1}
              required
              className={fieldClasses}
            />
          </Field>
          <Field label="Upload Visitor List (if more than 5)" htmlFor="visit-list">
            <input
              id="visit-list"
              name="visitorList"
              type="file"
              accept=".csv,.xlsx,.pdf"
              className={`${fieldClasses} file:mr-3 file:rounded-full file:border-0 file:bg-sage-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-forest-800`}
            />
          </Field>
        </div>

        <div className="space-y-3">
          {visitorRows.map((rowId, index) => (
            <div key={rowId} className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="First Name" htmlFor={`visitor-first-${rowId}`}>
                <input
                  id={`visitor-first-${rowId}`}
                  name={`visitorFirstName-${index}`}
                  type="text"
                  placeholder="Juan"
                  className={fieldClasses}
                />
              </Field>
              <Field label="Last Name" htmlFor={`visitor-last-${rowId}`}>
                <input
                  id={`visitor-last-${rowId}`}
                  name={`visitorLastName-${index}`}
                  type="text"
                  placeholder="Dela Cruz"
                  className={fieldClasses}
                />
              </Field>
              {visitorRows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVisitorRows((rows) => rows.filter((id) => id !== rowId))}
                  aria-label="Remove visitor"
                  className="col-span-2 self-end rounded-lg p-2.5 text-zinc-400 hover:bg-sage-100 hover:text-forest-800 sm:col-span-1"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setVisitorRows((rows) => [...rows, nextVisitorRowId()])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-700 hover:text-forest-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add Visitor Name Fields
        </button>
      </div>

      <div className="space-y-4">
        <FieldGroupLabel>Vehicle</FieldGroupLabel>
        <div className="inline-flex rounded-full border border-black/15 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setBringingVehicle(true)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              bringingVehicle ? "bg-forest-700 text-white" : "text-zinc-600 hover:text-forest-800"
            }`}
          >
            Yes, bringing a vehicle
          </button>
          <button
            type="button"
            onClick={() => setBringingVehicle(false)}
            className={`rounded-full px-4 py-1.5 transition-colors ${
              !bringingVehicle ? "bg-forest-700 text-white" : "text-zinc-600 hover:text-forest-800"
            }`}
          >
            No vehicle
          </button>
        </div>

        {bringingVehicle && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Plate Number" htmlFor="visit-plate">
              <input id="visit-plate" name="plateNumber" type="text" placeholder="ABC 1234" className={fieldClasses} />
            </Field>
            <Field label="Car Brand" htmlFor="visit-car-brand">
              <input id="visit-car-brand" name="carBrand" type="text" placeholder="Toyota" className={fieldClasses} />
            </Field>
            <Field label="Car Type" htmlFor="visit-car-type">
              <input
                id="visit-car-type"
                name="carType"
                type="text"
                placeholder="Van, Sedan, School Bus"
                className={fieldClasses}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <FieldGroupLabel>Additional Info</FieldGroupLabel>
        <Field label="Equipment to Bring" htmlFor="visit-equipment">
          <input
            id="visit-equipment"
            name="equipment"
            type="text"
            placeholder="Cameras, notebooks, recording gear"
            className={fieldClasses}
          />
        </Field>
        <Field label="Additional Notes" htmlFor="visit-notes">
          <textarea
            id="visit-notes"
            name="notes"
            rows={3}
            placeholder="Anything else we should know"
            className={fieldClasses}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-black/10 pt-6">
        {onCancel && (
          <Button type="button" variant="outline-forest" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="solid-forest">
          Submit Request
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
