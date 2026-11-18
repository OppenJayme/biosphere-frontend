"use client";

import { usePushDevice } from "@/features/push/use-push-device";

/** "Alerts on this device" control in the bell panel. Renders nothing while push is off server-side. */
export function PushDeviceToggle() {
  const { state, error, enable, disable } = usePushDevice();
  if (state.status === "hidden") return null;

  return (
    <div className="border-t border-black/10 px-4 py-2 text-xs text-zinc-600">
      {state.status === "unavailable" && <p>{state.message}</p>}
      {state.status === "blocked" && (
        <p>Alerts are blocked for BioSphere in this browser. Allow notifications in the site settings to turn them on.</p>
      )}
      {(state.status === "off" || state.status === "on" || state.status === "working") && (
        <div className="flex items-center justify-between gap-2">
          <span>
            {state.status === "on"
              ? "Alerts on this device are on. New inquiries, visit requests and visitor replies notify you even when BioSphere is closed."
              : "Get an alert on this device for new inquiries, visit requests and visitor replies."}
          </span>
          <button
            type="button"
            disabled={state.status === "working"}
            onClick={() => void (state.status === "on" ? disable() : enable())}
            className="shrink-0 rounded px-2 py-1 font-semibold text-forest-800 hover:bg-sage-100 focus-visible:outline-2 disabled:opacity-50"
          >
            {state.status === "working" ? "Updating…" : state.status === "on" ? "Turn off" : "Turn on"}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-1 text-amber-950">
          {error}
        </p>
      )}
    </div>
  );
}
