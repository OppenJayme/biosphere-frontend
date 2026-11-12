/** Serialized into the fresh browser's run-code call; no imported helpers or app session. */
export async function checkRecovery(page, { origin, bundle }) {
  // The pinned Playwright build treats an async waitForFunction predicate's
  // Promise as truthy, even when it resolves false. Poll the observed state.
  async function waitForFixtureState(target, field) {
    const deadline = Date.now() + 10000;
    let observed;
    while (Date.now() < deadline) {
      observed = await target.evaluate(async () => {
        const response = await fetch("/fixture/state", {
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error("Owned fixture state read failed");
        return response.json();
      });
      if (observed[field] === true) return observed;
      await target.waitForTimeout(100);
    }
    throw new Error("Owned fixture did not reach " + field + ": " + JSON.stringify(observed));
  }

  const context = page.context();
  if ((await context.cookies()).length || context.serviceWorkers().length) {
    throw new Error("Recovery context was not empty");
  }
  const errors = [];
  let blocked = 0;
  context.on("page", tab => tab.on("pageerror", error => errors.push(error.message)));
  await context.route("**/*", route => {
    const request = route.request();
    const url = new URL(request.url());
    const allowed = url.origin === origin && !url.search &&
      ((request.method() === "GET" && ["/", "/fixture/state", "/api/offline/specimens"].includes(url.pathname)) ||
       (request.method() === "POST" && url.pathname === "/api/offline/specimen-drafts"));
    if (allowed) return route.continue();
    blocked++;
    return route.abort();
  });
  let target = await context.newPage();
  try {
    await target.goto(origin);
    if ((await target.evaluate(() => indexedDB.databases())).length) {
      throw new Error("Recovery origin contained existing local data");
    }
    // Real offline connectivity emulation suppresses the hook's automatic sync while editing.
    await context.setOffline(true);
    await target.addScriptTag({ path: bundle });
    await target.getByText("No offline drafts on this device.", { exact: true }).waitFor();
    await target.getByRole("button", { name: "New offline draft", exact: true }).click();
    await target.getByRole("textbox", { name: "Common name", exact: true }).fill("TEST Owned Lost Response");
    await target.getByRole("textbox", { name: "Scientific name", exact: true }).fill("Testus recoverus");
    await target.getByRole("textbox", { name: "Specimen category", exact: true }).fill("Testing");
    await target.getByLabel("Gender", { exact: true }).selectOption("UNKNOWN");
    await target.getByRole("textbox", { name: "Remarks", exact: true }).fill("Synthetic recovery fixture only");
    await target.getByRole("button", { name: "Save on this device", exact: true }).click();
    try {
      await target.getByText("Pending Sync", { exact: true }).waitFor({ timeout: 5000 });
    } catch {
      throw new Error("Local save did not show Pending Sync: " + await target.locator("body").innerText());
    }
    await context.setOffline(false);
    // Use the real hook's stable-connection queue, not a fixture call to its sync functions.
    await target.getByText("Synchronizing", { exact: true }).waitFor();
    const accepted = await waitForFixtureState(target, "committed");
    if (accepted.forwarded !== 1 || accepted.firstClosed || accepted.holdExpired) {
      throw new Error("First commit was not held before tab closure");
    }
    // Only this fixture tab closes. The CLI's original about:blank tab remains alive.
    await target.close();
    target = await context.newPage();
    await target.goto(origin);
    await waitForFixtureState(target, "firstClosed");
    await context.setOffline(true);
    await target.addScriptTag({ path: bundle });
    await target.getByText("Sync Failed", { exact: true }).waitFor();
    await target.getByRole("alert").filter({ hasText: "The previous synchronization was interrupted. It is safe to retry." }).waitFor();
    if (await target.getByRole("button", { name: "Retry", exact: true }).isEnabled()) {
      throw new Error("Offline retry control was enabled");
    }
    await target.getByRole("button", { name: "Edit", exact: true }).click();
    for (const [label, expected] of [
      ["Common name", "TEST Owned Lost Response"], ["Scientific name", "Testus recoverus"],
      ["Specimen category", "Testing"], ["Remarks", "Synthetic recovery fixture only"],
      ["Accession number", ""], ["Classification status", ""],
    ]) {
      if (await target.getByRole("textbox", { name: label, exact: true }).inputValue() !== expected) {
        throw new Error("Recovered draft changed field: " + label);
      }
    }
    if (await target.getByLabel("Gender", { exact: true }).inputValue() !== "UNKNOWN") {
      throw new Error("Recovered gender changed");
    }
    await target.getByRole("button", { name: "Cancel", exact: true }).click();
    await context.setOffline(false);
    try {
      // A completed online queue auto-collapses. Reveal the attached receipt
      // through the real UI before retaining the original visibility check.
      await target.getByText("Synchronized", { exact: true }).waitFor({ state: "attached", timeout: 8000 });
      const workspaceToggle = target.getByRole("button", { name: "Offline specimen workspace", exact: true });
      if (await workspaceToggle.getAttribute("aria-expanded") === "false") {
        await workspaceToggle.click();
      }
      await target.getByText("Synchronized", { exact: true }).waitFor({ timeout: 8000 });
    } catch {
      const state = await target.evaluate(async () => (await fetch("/fixture/state")).json());
      throw new Error("Recovery did not synchronize: " + JSON.stringify(state) + " UI: " + await target.locator("body").innerText());
    }
    const recovered = await target.evaluate(async () => (await fetch("/fixture/state")).json());
    if (recovered.clientDraftId !== accepted.clientDraftId || recovered.specimenId !== accepted.specimenId ||
        recovered.forwarded !== 2 || !recovered.retryAlreadySynchronized || recovered.holdExpired) {
      throw new Error("Same-ID recovery did not return the original accepted specimen");
    }
    const cache = target.getByRole("listitem").filter({ hasText: "TEST Owned Lost Response" });
    await cache.getByText("UNCATALOGED", { exact: true }).waitFor();
    if (await target.getByRole("button", { name: "Retry", exact: true }).count()) {
      throw new Error("Synchronized receipt still offered retry");
    }
    if (errors.length || blocked !== 0 || context.serviceWorkers().length) {
      throw new Error("Unexpected page error, network destination or service worker");
    }
    return "OFFLINE_RECOVERY_OK";
  } finally {
    await context.setOffline(false);
    if (!target.isClosed()) await target.close();
  }
}
