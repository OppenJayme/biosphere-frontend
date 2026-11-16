"use client";

import { useCallback, useEffect, useState } from "react";
import { applicationServerKey, pushConfigSchema } from "./types";

export type PushDeviceState =
  /** Server push is off, or the check has not finished: show nothing. */
  | { status: "hidden" }
  | { status: "unavailable"; message: string }
  | { status: "blocked" }
  | { status: "off" }
  | { status: "on" }
  | { status: "working" };

function isAppleMobile() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

async function send(method: "POST" | "DELETE", endpoint: string) {
  const response = await fetch("/api/push", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  if (response.ok) return null;
  const body: unknown = await response.json().catch(() => null);
  return body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : "Push notifications could not be updated. Try again.";
}

/**
 * Push alerts for this browser. Registration is per device and per signed-in curator: the page
 * re-registers an existing subscription on load, so a browser shared by curators follows whoever
 * is signed in. The service worker only exists in production builds (PwaRegistration).
 */
export function usePushDevice() {
  const [state, setState] = useState<PushDeviceState>({ status: "hidden" });
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/push", { cache: "no-store" });
        const config = pushConfigSchema.safeParse(await response.json().catch(() => null));
        if (!active || !response.ok || !config.success || !config.data.enabled || !config.data.publicKey) return;
        setPublicKey(config.data.publicKey);

        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          setState({
            status: "unavailable",
            message: isAppleMobile()
              ? "On iPhone or iPad, add BioSphere to your Home Screen, then open it from there to turn on alerts."
              : "This browser does not support push notifications.",
          });
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!active) return;
        if (!registration) {
          setState({ status: "unavailable", message: "Reload BioSphere to finish setting up alerts on this device." });
          return;
        }
        if (Notification.permission === "denied") {
          setState({ status: "blocked" });
          return;
        }
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;
        if (subscription && Notification.permission === "granted") {
          // Keep the server copy current (and owned by whoever is signed in now).
          await send("POST", subscription.endpoint);
          if (active) setState({ status: "on" });
        } else {
          setState({ status: "off" });
        }
      } catch {
        // Push is optional; never let it break the bell.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!publicKey) return;
    setError(null);
    setState({ status: "working" });
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? { status: "blocked" } : { status: "off" });
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("No service worker");
      // A subscription made with an older server key cannot receive new pushes.
      const existing = await registration.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey(publicKey),
      });
      const message = await send("POST", subscription.endpoint);
      if (message) {
        await subscription.unsubscribe().catch(() => false);
        setError(message);
        setState({ status: "off" });
        return;
      }
      setState({ status: "on" });
    } catch {
      setError("Alerts could not be turned on for this device. Try again.");
      setState({ status: "off" });
    }
  }, [publicKey]);

  const disable = useCallback(async () => {
    setError(null);
    setState({ status: "working" });
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // Stop the browser first: even if the server call fails, nothing more arrives here.
        await subscription.unsubscribe();
        await send("DELETE", subscription.endpoint);
      }
      setState({ status: "off" });
    } catch {
      setError("Alerts could not be turned off. Try again.");
      setState({ status: "on" });
    }
  }, []);

  return { state, error, enable, disable };
}
