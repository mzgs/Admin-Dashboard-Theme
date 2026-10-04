// Run with a local server and Playwright available: node checks/home.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const root = process.env.DASHBOARD_URL || 'http://127.0.0.1:8000/';
    await page.goto(new URL('home.html', root).href);
    await page.waitForSelector('#transaction-rows .transaction-check');
    assert.equal(await page.locator('#transaction-rows tr').count(), 6);
    assert.equal(await page.locator('.mobile-menu').isVisible(), false);
    await page.selectOption('#report-period', 'week');
    assert.equal(await page.locator('#metric-revenue').textContent(), '$12,480.00');
    await page.click('[data-chart-metric="orders"]');
    assert.equal(await page.locator('#chart-total').textContent(), '492');
    await page.selectOption('#report-period', 'year');
    assert.equal(await page.locator('#chart-total').textContent(), '16,485');

    await page.selectOption('#transaction-status', 'Pending');
    assert.equal(await page.locator('#transaction-rows tr').count(), 3);
    await page.fill('#transaction-search', 'Lana');
    assert.equal(await page.locator('#transaction-rows tr').count(), 1);
    await page.check('#select-transactions');
    assert.equal(await page.locator('.transaction-check:checked').count(), 1);
    await page.fill('#transaction-search', 'no-matching-customer');
    assert.equal(await page.locator('.empty-state').count(), 1);
    assert.equal(await page.locator('#select-transactions').isDisabled(), true);
    await page.fill('#transaction-search', '');
    await page.selectOption('#transaction-status', 'all');
    await page.click('#next-page');
    assert.equal(await page.locator('#page-label').textContent(), '2 / 2');
    await page.click('#previous-page');

    await page.click('.dashboard-actions [data-bs-target="#transaction-modal"]');
    const unsafeName = '<img src=x onerror=alert(1)>';
    await page.fill('#new-customer', unsafeName);
    await page.fill('#new-email', 'sample@example.com');
    await page.fill('#new-amount', '123.45');
    await page.click('#transaction-form [type="submit"]');
    await page.waitForSelector('#transaction-modal', { state: 'hidden' });
    assert.equal(await page.locator('#transaction-rows tr:first-child .customer-name').textContent(), unsafeName);
    assert.equal(await page.locator('#transaction-rows img').count(), 0);
    assert.equal(await page.locator('#transaction-rows tr:first-child .table-amount').textContent(), '$123.45');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export-report')]);
    assert.equal(download.suggestedFilename(), 'evergreen-year-report.csv');
    const csv = await require('node:fs/promises').readFile(await download.path(), 'utf8');
    assert.match(csv, /428640/);

    await page.uncheck('#task-list input:first-child');
    assert.equal(await page.locator('#task-progress').getAttribute('aria-valuenow'), '20');
    await page.click('.panel-footer [data-bs-target="#task-modal"]');
    await page.fill('#new-task', 'Check dashboard');
    await page.click('#task-form [type="submit"]');
    await page.waitForSelector('#task-modal', { state: 'hidden' });
    assert.equal(await page.locator('#task-list input').count(), 6);
    await page.click('[data-bs-target="#reset-modal"]');
    await page.click('#reset-tasks');
    await page.waitForSelector('#reset-modal', { state: 'hidden' });
    assert.equal(await page.locator('#task-progress').getAttribute('aria-valuenow'), '0');
    await page.click('#details-tab');
    await page.waitForFunction(() => document.querySelector('#details-pane').classList.contains('show'));
    assert.equal(await page.locator('#details-tab').getAttribute('aria-selected'), 'true');
    await page.fill('#workspace-name', 'Test workspace');
    await page.click('#preferences-form [type="submit"]');
    await page.reload();
    assert.equal(await page.locator('#workspace-name').inputValue(), 'Test workspace');
    assert.equal(await page.locator('.workspace-switcher > span:nth-child(2)').textContent(), 'Test workspace');
    await page.click('.theme-toggle');
    assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light');
    await page.click('.topbar [data-bs-target="#notifications"]');
    await page.waitForSelector('#notifications.show');
    await page.click('#notifications [data-bs-dismiss="offcanvas"]');
    await page.waitForSelector('#notifications', { state: 'hidden' });
    await page.click('[data-bs-target="#help-two"]');
    await page.waitForSelector('#help-two.show');
    await page.click('[data-notify="Your dashboard is up to date."]');
    assert.equal(await page.locator('#toast-message').textContent(), 'Your dashboard is up to date.');

    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Horizontal overflow at ${width}px`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, `Unexpected page overflow at ${width}px`);
      assert.equal(await page.evaluate(() => document.querySelector('.dashboard-scroll').clientHeight > 0), true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('.mobile-menu');
    assert.equal(await page.locator('body').evaluate(body => body.classList.contains('sidebar-mobile-open')), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'), 'false');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.click('.sidebar-toggle');
    assert.equal(await page.locator('.sidebar').evaluate(element => element.clientWidth), 67);
    await page.click('.sidebar-toggle');
    await page.click('.sidebar-nav a[href="index.html"]');
    await page.waitForURL('**/index.html');
    assert.equal(await page.locator('tbody tr').count(), 24);
    await page.click('.sidebar-nav a[href="home.html"]');
    await page.waitForURL('**/home.html');
    assert.deepEqual(errors, []);
    console.log('Dashboard browser checks passed: charts, filters, pagination, safe form rendering, export, tasks, tabs, persistence, responsive layout, and navigation.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
