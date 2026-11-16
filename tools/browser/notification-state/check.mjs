export async function checkBell(page, bundle) {
  page.setDefaultTimeout(8000);
  const origin = "http://notifications-fixture.test";
  const idA = "NEW_INQUIRY:55555555-5555-4555-8555-555555555555";
  const idB = "NEW_VISIT_REQUEST:66666666-6666-4666-8666-666666666666";
  const itemA = {
    id: idA,
    type: "NEW_INQUIRY",
    title: "New general inquiry",
    recordType: "inquiry",
    recordId: "55555555-5555-4555-8555-555555555555",
    referenceCode: "55555555",
    createdAt: "2026-10-28T00:00:00.000Z",
    readAt: null,
  };
  const itemB = {
    id: idB,
    type: "NEW_VISIT_REQUEST",
    title: "New visit request",
    recordType: "visit_request",
    recordId: "66666666-6666-4666-8666-666666666666",
    referenceCode: "66666666",
    createdAt: "2026-10-28T00:00:00.000Z",
    readAt: null,
  };
  const base = {
    total: 2,
    unreadTotal: 2,
    pendingInquiries: 7,
    pendingVisitRequests: 4,
    emailFailures: 0,
    stateManagementEnabled: true,
    items: [itemA, itemB],
  };
  let feed = structuredClone(base);
  let writes = 0;
  let mode = "success";
  let releaseWrite;
  let holdNextGet = false;
  let releaseGet;
  let heldGetDone;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    // The feed read asks for ?limit=N; any other query string is unexpected.
    const feedRead =
      url.pathname === "/api/notifications" &&
      [...url.searchParams.keys()].every((key) => key === "limit");
    if (url.origin !== origin || (url.search && !feedRead)) return route.abort();
    if (url.pathname === "/" && request.method() === "GET") {
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><main id="root"></main>',
      });
    }
    if (url.pathname !== "/api/notifications") return route.abort();
    if (request.method() === "GET") {
      if (holdNextGet) {
        holdNextGet = false;
        const old = structuredClone(feed);
        await new Promise((resolve) => {
          releaseGet = resolve;
        });
        await route.fulfill({ json: old });
        heldGetDone();
        return;
      }
      return route.fulfill({ json: feed });
    }
    if (request.method() !== "PATCH") return route.abort();
    writes++;
    if (mode === "server-error")
      return route.fulfill({
        status: 503,
        json: { message: "INTERNAL_SYNTHETIC_MARKER" },
      });
    if (mode === "network-error") return route.abort();
    if (mode === "invalid-success")
      return route.fulfill({ json: { updated: false } });
    if (mode === "pending")
      await new Promise((resolve) => {
        releaseWrite = resolve;
      });
    const body = request.postDataJSON();
    if (body.notificationId === idA && body.state === "READ") {
      feed = {
        ...base,
        unreadTotal: 1,
        items: [{ ...itemA, readAt: "2026-10-28T01:00:00.000Z" }, itemB],
      };
    } else if (body.notificationId === idB && body.state === "DISMISSED") {
      feed = {
        ...base,
        total: 1,
        unreadTotal: 0,
        items: [{ ...itemA, readAt: "2026-10-28T01:00:00.000Z" }],
      };
    } else throw new Error("Unexpected fixture mutation");
    return route.fulfill({ json: { updated: true } });
  });
  async function mount(nextMode = "success", legacy = false) {
    mode = nextMode;
    writes = 0;
    feed = structuredClone(base);
    releaseWrite = undefined;
    releaseGet = undefined;
    holdNextGet = false;
    if (legacy) {
      delete feed.stateManagementEnabled;
      delete feed.unreadTotal;
    }
    await page.goto(origin);
    await page.addScriptTag({ path: bundle });
  }
  // Per-card actions live in each card's "..." menu (portalled outside the panel).
  const menuButton = (title, reference) =>
    page.getByRole("button", {
      name: `More actions: ${title} (${reference})`,
      exact: true,
    });
  const menuItem = (label) =>
    page.getByRole("menuitem", { name: label, exact: true });
  async function choose(title, reference, label) {
    await menuButton(title, reference).click();
    await menuItem(label).click();
  }
  const readA = () => choose("New general inquiry", "55555555", "Mark as read");

  await mount();
  await page
    .getByRole("button", { name: "Notifications, 2 unread", exact: true })
    .click();
  await readA();
  await page
    .getByRole("button", { name: "Notifications, 1 unread", exact: true })
    .waitFor();
  // Choosing from a card menu must leave the panel open, and a read card's
  // menu offers only Dismiss.
  await menuButton("New general inquiry", "55555555").click();
  if (
    (await menuItem("Mark as read").count()) ||
    !(await menuItem("Dismiss").isVisible())
  ) {
    throw new Error("Read card menu offered the wrong actions");
  }
  await page.keyboard.press("Escape");
  if (!(await page.getByRole("region", { name: "Notifications" }).isVisible())) {
    throw new Error("Escape in a card menu closed the whole panel");
  }
  await choose("New visit request", "66666666", "Dismiss");
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .waitFor();
  await page
    .getByText("7 inquiries · 4 visit requests pending", { exact: true })
    .waitFor();
  if (
    (await page.getByText("New visit request", { exact: true }).count()) ||
    writes !== 2 ||
    errors.length
  ) {
    throw new Error("Notification controls/counts/page errors failed");
  }
  // Failed/unknown updates retain the actionable feed and require explicit retry.
  for (const failureMode of [
    "server-error",
    "network-error",
    "invalid-success",
  ]) {
    await mount(failureMode);
    await page
      .getByRole("button", { name: "Notifications, 2 unread", exact: true })
      .click();
    await readA();
    await page
      .getByRole("alert")
      .filter({ hasText: "could not be confirmed" })
      .waitFor();
    await menuButton("New general inquiry", "55555555").click();
    if (
      (await menuItem("Mark as read").getAttribute("data-disabled")) !== null ||
      writes !== 1 ||
      (await page
        .getByText("INTERNAL_SYNTHETIC_MARKER", { exact: false })
        .count())
    ) {
      throw new Error(
        "Failed update lost controls, leaked internals or replayed automatically",
      );
    }
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Notifications, 2 unread", exact: true })
      .waitFor();
    mode = "success";
    await readA();
    await page
      .getByRole("button", { name: "Notifications, 1 unread", exact: true })
      .waitFor();
    if (writes !== 2) throw new Error("Explicit retry count incorrect");
  }
  await mount("pending");
  await page
    .getByRole("button", { name: "Notifications, 2 unread", exact: true })
    .click();
  await readA();
  await page
    .getByRole("status")
    .filter({ hasText: "Updating notification" })
    .waitFor();
  await menuButton("New general inquiry", "55555555").click();
  const pendingRead = menuItem("Mark as read");
  if ((await pendingRead.getAttribute("data-disabled")) === null)
    throw new Error("Pending mutation was still enabled");
  await pendingRead.evaluate((item) => {
    item.click();
    item.click();
  });
  await page.keyboard.press("Escape");
  releaseWrite();
  await page
    .getByRole("button", { name: "Notifications, 1 unread", exact: true })
    .waitFor();
  if (writes !== 1) throw new Error("Pending double click repeated mutation");

  await mount();
  await page
    .getByRole("button", { name: "Notifications, 2 unread", exact: true })
    .waitFor();
  holdNextGet = true;
  const oldDone = new Promise((resolve) => {
    heldGetDone = resolve;
  });
  await page
    .getByRole("button", { name: "Notifications, 2 unread", exact: true })
    .click();
  await readA();
  await page
    .getByRole("button", { name: "Notifications, 1 unread", exact: true })
    .waitFor();
  releaseGet();
  await oldDone;
  // Drain the fulfilled HTTP response and React updates before checking the final label.
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  if (
    !(await page
      .getByRole("button", { name: "Notifications, 1 unread", exact: true })
      .isVisible())
  ) {
    throw new Error("Old feed response overwrote a newer mutation result");
  }

  await mount("success", true);
  await page
    .getByRole("button", {
      name: "Notifications, 2 need attention",
      exact: true,
    })
    .click();
  if (await page.getByRole("button", { name: /^More actions:/ }).count()) {
    throw new Error("State controls appeared for a legacy/disabled backend");
  }
  if (errors.length)
    throw new Error("Notification page errors: " + errors.join("; "));
  return "NOTIFICATION_BELL_OK";
}
