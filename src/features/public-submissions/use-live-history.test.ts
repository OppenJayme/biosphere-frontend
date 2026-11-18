import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the polling effect without adding a DOM/testing-library dependency.
const hook = vi.hoisted(() => ({
  state: null as unknown,
  effect: null as null | (() => void | (() => void)),
}));
vi.mock("react", () => ({
  useState: () => [
    hook.state,
    (update: unknown) => {
      hook.state = typeof update === "function" ? (update as (value: unknown) => unknown)(hook.state) : update;
    },
  ],
  useEffect: (effect: () => void | (() => void)) => {
    hook.effect = effect;
  },
}));

import { useLiveHistory } from "./use-live-history";

const visitId = "11111111-1111-4111-8111-111111111111";
const inquiryId = "33333333-3333-4333-8333-333333333333";
const reply = {
  id: "22222222-2222-4222-8222-222222222222",
  direction: "INBOUND",
  type: "VISITOR_REPLY",
  subject: "Re: Visit request",
  message: "We will arrive on time.",
  recipientEmail: null,
  deliveryResult: null,
  sentAt: "2026-11-16T10:00:00.000Z",
  recordedBy: null,
  createdAt: "2026-11-16T10:01:00.000Z",
};
type History = Parameters<typeof useLiveHistory>[2];
const fetcher = vi.fn<typeof fetch>();
let doc: EventTarget & { visibilityState: string };
let browser: EventTarget & { setInterval: typeof setInterval; clearInterval: typeof clearInterval };

function activate(kind: "visit" | "inquiry", id: string, initial: History, expectedEntryIds: string[] = []) {
  // React is mocked above, so this helper drives the hook directly rather than rendering it.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const value = useLiveHistory(kind, id, initial, expectedEntryIds);
  const dispose = hook.effect?.();
  if (typeof dispose !== "function") throw new Error("Polling effect was not installed");
  return { value, dispose };
}

beforeEach(() => {
  vi.useFakeTimers();
  hook.state = null;
  hook.effect = null;
  fetcher.mockReset();
  vi.stubGlobal("fetch", fetcher);
  doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  browser = Object.assign(new EventTarget(), {
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval,
  });
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", browser);
  vi.stubGlobal("navigator", { onLine: true });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("automatic curator history refresh", () => {
  it("fetches the selected record after 30 seconds, validates the payload, and updates the displayed conversation", async () => {
    const initial: History = [];
    fetcher.mockResolvedValueOnce(Response.json([reply]));
    const { value, dispose } = activate("visit", visitId, initial);
    expect(value).toBe(initial);
    expect(fetcher).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/public-submissions/history/visit/" + visitId);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
    expect(useLiveHistory("visit", visitId, initial)).toEqual([reply]);
    dispose();
  });

  it("does not poll a hidden or offline tab and refreshes promptly when it becomes active", async () => {
    const { dispose } = activate("inquiry", inquiryId, []);
    doc.visibilityState = "hidden";
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetcher).not.toHaveBeenCalled();

    doc.visibilityState = "visible";
    fetcher.mockResolvedValueOnce(Response.json([]));
    doc.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);

    (navigator as { onLine: boolean }).onLine = false;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetcher).toHaveBeenCalledTimes(1);

    (navigator as { onLine: boolean }).onLine = true;
    fetcher.mockResolvedValueOnce(Response.json([]));
    browser.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(2);
    dispose();
  });

  it("never displays replies from the previously selected record", async () => {
    const initial: History = [];
    fetcher.mockResolvedValueOnce(Response.json([reply]));
    const first = activate("visit", visitId, initial);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(useLiveHistory("visit", visitId, initial)).toEqual([reply]);
    first.dispose();

    const newBaseline: History = [];
    const second = activate("inquiry", inquiryId, newBaseline);
    expect(second.value).toBe(newBaseline);
    second.dispose();
  });

  it("prefers newer server-rendered data over an older polling snapshot", async () => {
    const initial: History = [];
    fetcher.mockResolvedValueOnce(Response.json([]));
    const { dispose } = activate("visit", visitId, initial);
    await vi.advanceTimersByTimeAsync(30_000);
    const updatedFromServer = [reply];
    expect(useLiveHistory("visit", visitId, updatedFromServer)).toBe(updatedFromServer);
    dispose();
  });

  it("retains the known conversation on errors or malformed history responses", async () => {
    const initial: History = [reply];
    fetcher.mockResolvedValueOnce(Response.json({ error: "not a history" }));
    const { dispose } = activate("visit", visitId, initial);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(useLiveHistory("visit", visitId, initial)).toBe(initial);
    fetcher.mockRejectedValueOnce(new Error("synthetic network failure"));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(useLiveHistory("visit", visitId, initial)).toBe(initial);
    dispose();
  });

  it("does not overlap requests or apply a response after the selected record unmounts", async () => {
    let resolve!: (value: Response) => void;
    fetcher.mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
    const initial: History = [];
    const { dispose } = activate("visit", visitId, initial);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(fetcher).toHaveBeenCalledTimes(1);
    dispose();
    resolve(Response.json([reply]));
    await vi.advanceTimersByTimeAsync(0);
    expect(useLiveHistory("visit", visitId, initial)).toBe(initial);
  });
});

describe("bell-driven conversation refresh", () => {
  it("fetches at once when the bell lists a reply the open conversation does not show yet", async () => {
    const initial: History = [];
    fetcher.mockResolvedValueOnce(Response.json([reply]));
    const { dispose } = activate("visit", visitId, initial, [reply.id]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe("/api/public-submissions/history/visit/" + visitId);
    expect(useLiveHistory("visit", visitId, initial, [reply.id])).toEqual([reply]);
    dispose();
  });

  it("waits for the normal poll when the listed reply is already on screen", async () => {
    const { dispose } = activate("visit", visitId, [reply], [reply.id]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).not.toHaveBeenCalled();
    dispose();
  });

  it("does not fetch at once for a hidden tab", async () => {
    doc.visibilityState = "hidden";
    const { dispose } = activate("visit", visitId, [], [reply.id]);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).not.toHaveBeenCalled();
    dispose();
  });
});
