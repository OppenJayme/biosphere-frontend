/** HTTP checks for the disposable counting server; no application or database imports. */
import assert from "node:assert/strict";
import test from "node:test";
import { startCanaryServer } from "./isolation-server.mjs";

test("counts real synthetic arrivals through HTTP without storing payloads", async () => {
  const canary = await startCanaryServer();
  try {
    const url = new URL(canary.origin);
    assert.equal(url.hostname, "127.0.0.1");
    assert.ok(!["3000", "3001"].includes(url.port));
    assert.deepEqual(await (await fetch(`${canary.origin}/counts`)).json(), {
      control: 0, held: 0, aborted: 0, offline: 0,
    });
    assert.equal((await fetch(`${canary.origin}/canary/control`, {
      method: "POST", body: "synthetic fixture only",
    })).status, 204);
    assert.deepEqual(await (await fetch(`${canary.origin}/counts`)).json(), {
      control: 1, held: 0, aborted: 0, offline: 0,
    });
  } finally {
    await canary.close();
  }
});

test("rejects credentials and unknown routes without counting or forwarding them", async () => {
  const canary = await startCanaryServer();
  try {
    for (const headers of [
      { Authorization: "synthetic-only" }, { Cookie: "fixture=synthetic" },
      { Authorization: "" }, { Cookie: "" },
    ]) {
      assert.equal((await fetch(`${canary.origin}/canary/control`, {
        method: "POST", headers,
      })).status, 400);
    }
    assert.equal((await fetch(`${canary.origin}/unconfigured-target`, { method: "POST" })).status, 404);
    assert.deepEqual(await (await fetch(`${canary.origin}/counts`)).json(), {
      control: 0, held: 0, aborted: 0, offline: 0,
    });
  } finally {
    await canary.close();
  }
});
