export async function checkPublicDialogs(page, bundle) {
  page.setDefaultTimeout(8000);
  const origin = "http://public-dialog-fixture.test";
  let nonReadRequests = 0;
  let unexpectedRequests = 0;
  let scenarios = 0;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
      nonReadRequests++;
    if (request.url() === `${origin}/` && request.method() === "GET") {
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><body style="overflow:auto"><main id="root"></main></body>',
      });
    }
    unexpectedRequests++;
    return route.abort();
  });
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  for (const kind of ["inquiry", "visit"]) {
    for (const closeMethod of ["Escape", "Close", "Cancel"]) {
      await page.goto(origin);
      await page.addScriptTag({ path: bundle });
      const priorOverflow =
        closeMethod === "Close"
          ? ""
          : closeMethod === "Cancel"
            ? "scroll"
            : "auto";
      await page.evaluate((value) => {
        document.body.style.overflow = value;
      }, priorOverflow);
      const trigger = page.getByRole("button", {
        name: kind === "inquiry" ? "Send an inquiry" : "Request a visit",
        exact: true,
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: kind === "inquiry" ? "Inquiry" : "Request a Visit",
        exact: true,
      });
      await dialog.waitFor({ state: "visible" });
      assert(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        ),
        `${kind}: opening did not move focus inside`,
      );
      assert(
        (await page.evaluate(() => document.body.style.overflow)) === "hidden",
        `${kind}: body scroll not locked`,
      );
      const first = dialog.getByRole("button", { name: "Close", exact: true });
      const last = dialog.getByRole("button", {
        name: kind === "inquiry" ? "Send Inquiry" : "Submit Request",
        exact: true,
      });
      await first.focus();
      await page.keyboard.press("Shift+Tab");
      assert(
        await last.evaluate((element) => document.activeElement === element),
        `${kind}: backward Tab did not wrap to last control`,
      );
      await page.keyboard.press("Tab");
      assert(
        await first.evaluate((element) => document.activeElement === element),
        `${kind}: forward Tab did not wrap to first control`,
      );
      await page
        .getByRole("button", { name: "Background action", exact: true })
        .evaluate((element) => element.focus());
      assert(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        ),
        `${kind}: background stole focus`,
      );
      await dialog.locator('[name="name"]').fill("TEST Keyboard Visitor");
      await page.keyboard.press("Tab");
      assert(
        await dialog.evaluate((element) =>
          element.contains(document.activeElement),
        ),
        `${kind}: normal field Tab left the dialog`,
      );
      if (closeMethod === "Escape") await page.keyboard.press("Escape");
      else {
        await dialog
          .getByRole("button", { name: closeMethod, exact: true })
          .focus();
        await page.keyboard.press("Enter");
      }
      await dialog.waitFor({ state: "detached" });
      assert(
        await trigger.evaluate((element) => document.activeElement === element),
        `${kind}/${closeMethod}: opener focus not restored`,
      );
      assert(
        (await page.evaluate(() => document.body.style.overflow)) ===
          priorOverflow,
        `${kind}/${closeMethod}: prior scroll style not restored`,
      );
      scenarios++;
    }
  }
  assert(
    nonReadRequests === 0 && unexpectedRequests === 0,
    "Keyboard check attempted a submission or non-fixture request",
  );
  assert(errors.length === 0, "Unexpected browser runtime error");
  return {
    marker: "PUBLIC_DIALOG_OK",
    scenarios,
    nonReadRequests,
    unexpectedRequests,
  };
}
