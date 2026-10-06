// Run with the local server and Playwright available: node checks/date-range.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-06T12:00:00'));
    await page.goto(new URL('index.html', process.env.DASHBOARD_URL || 'http://127.0.0.1:8000/').href);
    await page.waitForSelector('#transaction-rows tr');
    const trigger = page.locator('#date-range-trigger'), calendar = page.locator('#data-examples [data-date-range] .date-range-calendar');
    const date = key => calendar.locator(`[data-calendar-date="${key}"]`);
    assert.equal(await page.locator('[data-report-period="day"]').getAttribute('aria-pressed'), 'true');
    await trigger.click();
    await page.waitForFunction(() => document.querySelector('#data-examples [data-date-range] [data-calendar-caption]').textContent === 'October 2026');
    assert.equal(await calendar.isVisible(), true);
    assert.equal(await page.locator('#data-examples [data-date-range] [data-calendar-caption]').textContent(), 'October 2026');
    await date('2026-10-04').click();
    await date('2026-10-10').click();
    assert.equal(await calendar.isVisible(), true, 'Selection must keep the calendar open');
    assert.equal(await calendar.locator('[aria-selected="true"]').count(), 7);
    assert.equal(await trigger.getAttribute('title'), '04 Oct 2026 - 10 Oct 2026');
    assert.equal(await page.locator('.date-range-dot').isVisible(), true);
    assert.equal(await page.locator('[data-report-period][aria-pressed="true"]').count(), 0);
    assert.match(await page.locator('#revenue-subtitle').textContent(), /04 Oct 2026 - 10 Oct 2026/);
    await date('2026-10-14').click();
    assert.equal(await calendar.locator('[aria-selected="true"]').count(), 11, 'Later clicks adjust the end');
    await date('2026-09-30').click();
    assert.equal(await trigger.getAttribute('title'), '30 Sept 2026 - 14 Oct 2026');
    await date('2026-09-30').press('ArrowLeft');
    assert.equal(await page.locator(':focus').getAttribute('data-calendar-date'), '2026-09-29');
    await page.locator(':focus').press('PageUp');
    assert.equal(await page.locator(':focus').getAttribute('data-calendar-date'), '2026-08-29');
    await page.keyboard.press('Escape');
    assert.equal(await calendar.isVisible(), false);
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await trigger.click();
    await page.waitForFunction(() => document.querySelector('#data-examples [data-date-range] [data-calendar-caption]').textContent === 'September 2026');
    assert.equal(await page.locator('#data-examples [data-date-range] [data-calendar-caption]').textContent(), 'September 2026');
    await calendar.locator('[data-calendar-month="1"]').click();
    await calendar.locator('[data-calendar-month="1"]').click();
    assert.equal(await page.locator('#data-examples [data-date-range] [data-calendar-caption]').textContent(), 'November 2026');
    await page.locator('#data-examples-title').click();
    assert.equal(await calendar.isVisible(), false, 'Outside click dismisses the popup');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-report')]);
    assert.match(await require('node:fs/promises').readFile(await download.path(), 'utf8'), /30 Sept 2026 - 14 Oct 2026/);
    await page.click('[data-report-period="week"]');
    assert.equal(await page.locator('.date-range-dot').isVisible(), false);
    assert.equal(await page.locator('#metric-revenue').textContent(), '$12,480.00');
    await trigger.click();
    assert.equal(await calendar.locator('[aria-selected="true"]').count(), 0);
    await date('2026-10-06').click();
    await date('2026-10-06').click();
    assert.equal(await calendar.locator('[aria-selected="true"]').count(), 0, 'Clicking a single selected date again clears it');
    assert.equal(await page.locator('.date-range-dot').isVisible(), false);
    assert.equal(await calendar.isVisible(), true);
    await page.keyboard.press('Escape');
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => AdminUI.setTheme(theme), theme);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await trigger.click();
        await page.waitForFunction(() => document.querySelector('#date-range-trigger').getAttribute('aria-expanded') === 'true');
        assert.equal(await calendar.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }), true, `Popup fits at ${width}px (${theme})`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.keyboard.press('Escape');
      }
    }
    assert.deepEqual(errors, []);
    console.log('Date range checks passed: presets, immediate range selection, adjustment, navigation, keyboard, dismissal, focus restoration, export, themes, and mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
