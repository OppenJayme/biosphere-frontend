/**
 * Condition drop-down with an "Other…" text box, shared by the lot forms and the condition filters.
 * An unlisted starting value opens under Other, so it is never cleared by being off the list.
 *
 * The select stays uncontrolled because React resets forms after an action, which would blank a
 * controlled select. Callers change `key` when the starting value changes from outside.
 */

"use client";

import { useState } from "react";
import {
  CONDITION_OPTIONS,
  OTHER_CONDITION_VALUE,
  isListedCondition,
  normalizeConditionClass,
} from "@/features/specimen-lots/condition-options";

export function ConditionField({
  id,
  name,
  defaultValue = "",
  emptyLabel,
  required = false,
  invalid = false,
  describedBy,
  className,
  onValueChange,
}: {
  id?: string;
  /** Omit for a filter whose value is read through `onValueChange` instead of a form. */
  name?: string;
  defaultValue?: string;
  emptyLabel: string;
  required?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className: string;
  onValueChange?: (value: string) => void;
}) {
  const initial = normalizeConditionClass(defaultValue);
  const startsUnlisted = initial !== "" && !isListedCondition(initial);
  const [otherOpen, setOtherOpen] = useState(startsUnlisted);
  const [otherText, setOtherText] = useState(startsUnlisted ? initial : "");

  function selectOption(value: string) {
    const other = value === OTHER_CONDITION_VALUE;
    setOtherOpen(other);
    onValueChange?.(other ? otherText : value);
  }

  return (
    <>
      <select
        id={id}
        // Only one of the two controls submits, so the marker value never reaches the server.
        name={otherOpen ? undefined : name}
        required={required}
        defaultValue={startsUnlisted ? OTHER_CONDITION_VALUE : initial}
        onChange={(event) => selectOption(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className}
      >
        <option value="">{emptyLabel}</option>
        {CONDITION_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        <option value={OTHER_CONDITION_VALUE}>Other…</option>
      </select>
      {otherOpen && (
        <span className="mt-2 block">
          <input
            name={name}
            type="text"
            required={required}
            value={otherText}
            onChange={(event) => {
              setOtherText(event.target.value);
              onValueChange?.(event.target.value);
            }}
            maxLength={100}
            // Move to the box when the user picks Other, not when a page opens with an unlisted value.
            autoFocus={!startsUnlisted}
            placeholder="Type the condition"
            aria-label="Other condition"
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={className}
          />
        </span>
      )}
    </>
  );
}
