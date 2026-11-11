"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  availabilityCovers,
  fetchVisitAvailability,
  mergeAvailability,
  type VisitAvailability,
} from "@/features/visit-requests/availability";

export type AvailabilityStatus = "loading" | "ready" | "error";

/**
 * Loads opening hours and booked times for the public visit form: about three months from today on
 * open, then any later month a visitor picks. `reload` starts over, for example after the server
 * reports that a time was just taken.
 */
export function useVisitAvailability(today: string) {
  const [availability, setAvailability] = useState<VisitAvailability | null>(null);
  const [status, setStatus] = useState<AvailabilityStatus>("loading");
  const inFlight = useRef(new Set<string>());

  const load = useCallback((from: string, replace: boolean) => {
    if (inFlight.current.has(from)) return;
    inFlight.current.add(from);
    fetchVisitAvailability(from)
      .then(({ data, range }) => {
        setAvailability((current) => mergeAvailability(replace ? null : current, data, range));
        setStatus("ready");
      })
      .catch(() => setStatus("error"))
      .finally(() => inFlight.current.delete(from));
  }, []);

  useEffect(() => {
    load(today, false);
  }, [load, today]);

  /** Loads the range starting at `date` unless it is already loaded (or in the past). */
  const ensureDate = useCallback(
    (date: string) => {
      if (date < today || availabilityCovers(availability, date)) return;
      setStatus("loading");
      load(date, false);
    },
    [availability, load, today],
  );

  const reload = useCallback(() => {
    setStatus("loading");
    load(today, true);
  }, [load, today]);

  return { availability, status, ensureDate, reload };
}
