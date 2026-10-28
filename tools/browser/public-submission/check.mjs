export async function checkPublicForms(page, bundle) {
  page.setDefaultTimeout(8000);
  const origin = "http://public-submissions-fixture.test";
  const receipt = {
    id: "55555555-5555-4555-8555-555555555555",
    referenceCode: "55555555",
    status: "PENDING",
    submittedAt: "2026-10-28T01:00:00.000Z",
  };
  let posts = [];
  let mode = "success";
  let releasePending;
  let scenarios = 0;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.context().route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || url.search) return route.abort();
    if (
      request.method() === "GET" &&
      ["/inquiry", "/visit"].includes(url.pathname)
    ) {
      return route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><main id="root"></main>',
      });
    }
    if (
      request.method() !== "POST" ||
      !["/inquiries", "/visit-requests"].includes(url.pathname)
    )
      return route.abort();
    posts.push({ path: url.pathname, body: request.postDataJSON() });
    if (mode === "malformed") return route.fulfill({ status: 201, json: {} });
    if (mode === "transport") return route.abort();
    if (mode === "server")
      return route.fulfill({
        status: 503,
        json: { message: "PRIVATE_SERVER_MARKER" },
      });
    if (mode === "validation")
      return route.fulfill({
        status: 400,
        json: { message: ["Correct the synthetic email field"] },
      });
    if (mode === "rate-limit")
      return route.fulfill({
        status: 429,
        json: { message: "PRIVATE_SERVER_MARKER" },
      });
    if (mode === "pending")
      await new Promise((resolve) => {
        releasePending = resolve;
      });
    return route.fulfill({ status: 201, json: receipt });
  });
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  for (const kind of ["inquiry", "visit"]) {
    for (const scenario of [
      "malformed",
      "transport",
      "server",
      "validation",
      "rate-limit",
      "success",
      "pending",
    ]) {
      mode = scenario;
      posts = [];
      releasePending = undefined;
      await page.goto(`${origin}/${kind}`);
      await page.addScriptTag({ path: bundle });
      await page.locator('[name="name"]').fill("TEST Synthetic Visitor");
      await page.locator('[name="email"]').fill("visitor@example.test");
      if (kind === "inquiry") {
        await page
          .locator('[name="message"]')
          .fill("Synthetic inquiry retained after an uncertain response.");
      } else {
        await page.locator('[name="phone"]').fill("09171234567");
        await page.locator('[name="organization"]').fill("TEST Museum Group");
        await page
          .locator('[name="purpose"]')
          .fill(
            "Synthetic visit request retained after an uncertain response.",
          );
        const date = page.locator('[name="scheduleDate"]');
        await date.fill(await date.getAttribute("min"));
        await page.locator('[name="scheduleStart"]').fill("09:00");
        await page.locator('[name="scheduleEnd"]').fill("10:00");
        await page.locator('[name="visitorCount"]').fill("1");
        await page.locator('[name="visitorFirstName"]').fill("Synthetic");
        await page.locator('[name="visitorLastName"]').fill("Visitor");
        await page.locator('[name="notes"]').fill("Keep this synthetic note.");
      }
      await page.locator('[name="consent"]').check();
      const fieldsBefore = await page
        .locator("form")
        .evaluate((form) => JSON.stringify([...new FormData(form)]));
      const label = kind === "inquiry" ? "Send Inquiry" : "Submit Request";
      const heading =
        kind === "inquiry"
          ? "Your inquiry was sent"
          : "Your visit request was sent";
      const submit = page.getByRole("button", { name: label, exact: true });
      await submit.click();
      if (scenario === "pending") {
        await page.locator('button[aria-busy="true"]').waitFor();
        await page.locator("form").evaluate((form) => {
          form.requestSubmit();
          form.requestSubmit();
        });
        await page.waitForTimeout(150);
        assert(posts.length === 1, `${kind}: pending submission replayed`);
        assert(
          typeof releasePending === "function",
          "Pending response was not captured",
        );
        releasePending();
      }
      if (["success", "pending"].includes(scenario)) {
        await page
          .getByRole("heading", { name: heading, exact: true })
          .waitFor();
        await page.getByText("55555555", { exact: true }).waitFor();
        assert(posts.length === 1, `${kind}: success replayed`);
        await page
          .getByRole("button", { name: "Send another", exact: true })
          .click();
        assert(
          (await page.locator('[name="name"]').inputValue()) === "",
          `${kind}: confirmed send-another did not clear fields`,
        );
      } else {
        const uncertain = ["malformed", "transport", "server"].includes(
          scenario,
        );
        const alert = page.getByRole("alert");
        await alert
          .filter({
            hasText: uncertain
              ? "couldn't confirm"
              : scenario === "validation"
                ? "Some details were not accepted"
                : "Too many submissions",
          })
          .waitFor();
        assert(
          (await page
            .getByRole("heading", { name: heading, exact: true })
            .count()) === 0,
          `${kind}: false success screen`,
        );
        const fieldsAfter = await page
          .locator("form")
          .evaluate((form) => JSON.stringify([...new FormData(form)]));
        assert(
          fieldsAfter === fieldsBefore,
          `${kind}: entered fields or consent were lost`,
        );
        assert(
          !(await page
            .locator("body")
            .textContent()
            .then((text) => text.includes("PRIVATE_SERVER_MARKER"))),
          "Raw server marker leaked",
        );
        assert(posts.length === 1, `${kind}: unexpected replay`);
        if (uncertain) {
          assert(
            await submit.isDisabled(),
            `${kind}: unknown result permits immediate resend`,
          );
          assert(
            await alert.evaluate(
              (element) => document.activeElement === element,
            ),
            `${kind}: unknown alert not focused`,
          );
          await page.locator("form").evaluate((form) => form.requestSubmit());
          await page.waitForTimeout(150);
          assert(
            posts.length === 1,
            `${kind}: Enter/programmatic submit bypassed acknowledgement`,
          );
          await page
            .getByRole("button", {
              name: "I checked; allow another submission",
              exact: true,
            })
            .click();
          assert(
            posts.length === 1,
            `${kind}: acknowledgement itself sent another request`,
          );
          assert(
            await submit.isEnabled(),
            `${kind}: explicit retry remains blocked`,
          );
          mode = "success";
          await submit.click();
          await page
            .getByRole("heading", { name: heading, exact: true })
            .waitFor();
          await page.getByText("55555555", { exact: true }).waitFor();
          assert(posts.length === 2, `${kind}: explicit retry count wrong`);
          assert(
            JSON.stringify(posts[0]) === JSON.stringify(posts[1]),
            `${kind}: retained payload changed on explicit retry`,
          );
        } else {
          assert(
            await submit.isEnabled(),
            `${kind}: known rejection incorrectly requires acknowledgement`,
          );
          assert(
            (await page
              .getByRole("button", {
                name: "I checked; allow another submission",
                exact: true,
              })
              .count()) === 0,
            `${kind}: known rejection shown as unknown`,
          );
          if (scenario === "validation")
            await alert
              .getByText("Correct the synthetic email field", { exact: true })
              .waitFor();
        }
      }
      assert(
        posts.every(
          (post) =>
            post.path ===
            (kind === "inquiry" ? "/inquiries" : "/visit-requests"),
        ),
        "Form posted to wrong endpoint",
      );
      assert(errors.length === 0, "Unexpected browser runtime error");
      scenarios++;
    }
  }
  return { marker: "PUBLIC_SUBMISSION_UI_OK", scenarios };
}
