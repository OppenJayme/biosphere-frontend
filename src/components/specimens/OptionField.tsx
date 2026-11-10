/**
 * Drop-down for a free-text specimen field, following ConditionField: a list with an optional
 * "Other…" text box. A starting value that is not on the list is never cleared: with Other it opens
 * in the box, and on a closed list it stays selectable as "(not on the list)".
 *
 * The select stays uncontrolled because React resets forms after an action, which would blank a
 * controlled select. Callers change `key` when the starting value changes from outside.
 */

"use client";

import { useState } from "react";
import {
  OTHER_OPTION_VALUE,
  matchListed,
  type FieldOptionList,
} from "@/features/specimens/field-options";

export function OptionField({
  id,
  name,
  list,
  label,
  defaultValue = "",
  emptyLabel = "Not recorded",
  maxLength,
  invalid = false,
  describedBy,
  className,
  onValueChange,
}: {
  id: string;
  name: string;
  list: FieldOptionList;
  /** Lower-case noun for the Other box, e.g. "specimen category". */
  label: string;
  defaultValue?: string;
  emptyLabel?: string;
  maxLength: number;
  invalid?: boolean;
  describedBy?: string;
  className: string;
  onValueChange?: (value: string) => void;
}) {
  const initial = matchListed(list, defaultValue);
  const startsUnlisted = initial !== "" && !list.options.includes(initial);
  const keepUnlisted = startsUnlisted && !list.allowOther;
  const [otherOpen, setOtherOpen] = useState(startsUnlisted && list.allowOther);
  const [otherText, setOtherText] = useState(startsUnlisted && list.allowOther ? initial : "");

  function selectOption(value: string) {
    const other = value === OTHER_OPTION_VALUE;
    setOtherOpen(other);
    onValueChange?.(other ? otherText : value);
  }

  return (
    <>
      <select
        id={id}
        // Only one of the two controls submits, so the marker value never reaches the server.
        name={otherOpen ? undefined : name}
        defaultValue={startsUnlisted && list.allowOther ? OTHER_OPTION_VALUE : initial}
        onChange={(event) => selectOption(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className={className}
      >
        <option value="">{emptyLabel}</option>
        {list.options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
        {keepUnlisted && <option value={initial}>{initial} (not on the list)</option>}
        {list.allowOther && <option value={OTHER_OPTION_VALUE}>Other…</option>}
      </select>
      {otherOpen && (
        <span className="mt-2 block">
          <input
            name={name}
            type="text"
            value={otherText}
            onChange={(event) => {
              setOtherText(event.target.value);
              onValueChange?.(event.target.value);
            }}
            maxLength={maxLength}
            // Move to the box when the user picks Other, not when a page opens with an unlisted value.
            autoFocus={!startsUnlisted}
            placeholder={`Type the ${label}`}
            aria-label={`Other ${label}`}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={className}
          />
        </span>
      )}
    </>
  );
}
