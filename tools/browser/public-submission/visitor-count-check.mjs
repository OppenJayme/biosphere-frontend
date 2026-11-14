/** Real form behavior with synthetic HTTP; every other request is blocked. */
export async function checkVisitorCount(page, bundle) {
  page.setDefaultTimeout(8000);
  const origin = 'http://public-submissions-fixture.test';
  const posts = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.context().route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (request.method() === 'GET' && url.pathname === '/visit') {
      return route.fulfill({contentType:'text/html',body:'<!doctype html><main id="root"></main>'});
    }
    if (request.method() === 'GET' && url.pathname === '/visit-requests/availability') {
      return route.fulfill({json:{openingHours:[{dayOfWeek:1,start:'08:00',end:'11:00'}],booked:[]}});
    }
    if (request.method() === 'POST' && url.pathname === '/visit-requests') {
      posts.push(request.postDataJSON());
      return route.fulfill({status:201,json:{id:'55555555-5555-4555-8555-555555555555',referenceCode:'55555555',status:'PENDING',submittedAt:'2026-11-13T01:00:00.000Z'}});
    }
    return route.abort();
  });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  async function fillRequiredFields() {
    await page.getByLabel('Contact Person Name',{exact:true}).fill('Synthetic Contact');
    await page.getByLabel('Email Address',{exact:true}).fill('visitor@example.test');
    await page.getByLabel('Contact Number',{exact:true}).fill('09171234567');
    await page.getByLabel('Organization / School',{exact:true}).fill('Synthetic School');
    await page.getByLabel('Purpose of Visit',{exact:true}).fill('Synthetic count regression');
    const date = page.locator('[name="scheduleDate"]');
    const monday = new Date(`${await date.getAttribute('min')}T00:00:00Z`);
    monday.setUTCDate(monday.getUTCDate()+7);
    while(monday.getUTCDay()!==1) monday.setUTCDate(monday.getUTCDate()+1);
    await date.fill(monday.toISOString().slice(0,10));
    // 12-hour selects that still submit 24-hour "HH:MM" values.
    await page.getByLabel('Start Time',{exact:true}).selectOption({label:'9:00 AM'});
    await page.getByLabel('End Time',{exact:true}).selectOption({label:'10:00 AM'});
    await page.locator('[name="consent"]').check();
  }
  await page.goto(`${origin}/visit`);
  await page.addScriptTag({path:bundle});
  const count = page.getByLabel('Number of Visitors', {exact:true});
  const names = page.locator('[name="visitorFirstName"]');
  const lastNames = page.locator('[name="visitorLastName"]');
  const add = page.getByRole('button',{name:'Add a visitor name',exact:true});
  await count.fill('10');
  for (let i=1;i<10;i++) await add.click();
  assert(await names.count() === 10, 'Expected ten visitor name rows');
  assert(await add.isDisabled(), 'Declared count 10 still allows an eleventh visitor row');
  await page.getByRole('status').filter({hasText:'Visitor name limit reached (10)'}).waitFor();
  await names.nth(9).fill('Retain this name');
  // Other required fields are valid: the excess-row guard must be what stops this request.
  await fillRequiredFields();
  await count.fill('2');
  await page.getByRole('alert').filter({hasText:'10 visitor name rows'}).waitFor();
  assert(await names.nth(9).inputValue() === 'Retain this name','Lowering the count discarded a name');
  assert(await page.getByRole('button',{name:'Submit Request',exact:true}).isDisabled(),'Excess rows allow submission');
  await page.locator('form').evaluate(form => form.requestSubmit());
  assert(posts.length === 0, 'Excess rows caused a request');
  await count.fill('11');
  assert(await add.isEnabled(), 'Increasing the count did not allow another name');
  await add.click();
  assert(await names.count() === 11, 'Could not add row after increasing count');
  await page.getByRole('button',{name:'Remove visitor 11',exact:true}).click();
  assert(await add.isEnabled(), 'Removing a row did not restore Add');
  for (const invalid of ['', '0', '-1', '1.5', '201']) {
    await count.fill(invalid);
    assert(await count.getAttribute('aria-invalid') === 'true',`Missing immediate error for count ${invalid}`);
    assert(await add.isDisabled(),`Invalid count ${invalid} permits adding names`);
  }
  await count.fill('200');
  await page.getByRole('status').filter({hasText:'Maximum request size reached (200 visitors)'}).waitFor();
  assert(await count.getAttribute('aria-invalid') !== 'true','Maximum accepted count rejected');
  await count.fill('10');
  assert(await page.getByRole('alert').count() === 0,'Corrected count retains stale error');
  // Separate clicks allow React to render each added row.
  while (await page.locator('[name="scheduleDate"]').count()<5) {
    await page.getByRole('button',{name:'Add another option',exact:true}).click();
  }
  await page.getByRole('status').filter({hasText:'Maximum of 5 preferred schedules reached'}).waitFor();
  await page.getByRole('radio',{name:'Yes, bringing a vehicle'}).check();
  for(let i=1;i<10;i++) await page.getByRole('button',{name:'Add another vehicle',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Maximum of 10 vehicles reached'}).waitFor();
  await page.goto(`${origin}/visit`);
  await page.addScriptTag({path:bundle});
  await count.fill('2');
  await add.click();
  await names.nth(0).fill('Synthetic One');
  await names.nth(1).fill('Synthetic Two');
  await lastNames.nth(0).fill('Visitor');
  await fillRequiredFields();
  // Names are required: a missing last name blocks the request and marks only that row.
  await page.getByRole('button',{name:'Submit Request',exact:true}).click();
  await page.getByText("Enter this visitor's last name.",{exact:true}).waitFor();
  assert(posts.length===0,'A missing last name still sent the request');
  assert(await lastNames.nth(1).getAttribute('aria-invalid')==='true','The row missing a last name is not marked invalid');
  await lastNames.nth(1).fill('Visitor');
  await page.getByRole('button',{name:'Submit Request',exact:true}).click();
  await page.getByRole('heading',{name:'Your visit request was sent',exact:true}).waitFor();
  assert(posts.length===1 && posts[0].visitorCount===2 && posts[0].visitors.length===2 && posts[0].visitors[1].lastName==='Visitor' && posts[0].preferredSchedules[0].startTime==='09:00' && posts[0].preferredSchedules[0].endTime==='10:00','Valid request did not keep the count, full names and 24-hour times');
  await page.getByRole('button',{name:'Send another',exact:true}).click();
  assert(await count.inputValue()==='1' && await names.count()===1 && await add.isDisabled(),'Send another did not reset count, names and limit');
  assert(errors.length===0,`Browser errors: ${errors.join('; ')}`);
  assert(posts.length===1,'Unexpected extra form submission');
  return {marker:'VISITOR_COUNT_UI_OK', scenarios:15, requests:posts.length};
}
