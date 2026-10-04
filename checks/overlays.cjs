// Run against the local server with Playwright available: node checks/overlays.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('index.html', process.env.DASHBOARD_URL || 'http://127.0.0.1:8000/').href);
    await page.waitForSelector('#transaction-rows tr');
    const waitClosed = async id => {
      await page.waitForSelector(`#${id}`, { state: 'hidden' });
      await page.waitForSelector('.modal-backdrop, .offcanvas-backdrop', { state: 'hidden' });
      assert.equal(await page.locator('.workspace').evaluate(element => element.inert), false);
      assert.equal(await page.locator('.sidebar').evaluate(element => element.inert), false);
    };
    const formTrigger = page.locator('#overlays [data-bs-target="#transaction-modal"]');
    await formTrigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'new-customer');
    assert.equal(await page.locator('#transaction-modal').getAttribute('aria-modal'), 'true');
    assert.equal(await page.locator('.workspace').evaluate(element => element.inert), true);
    assert.equal(await page.locator('.sidebar').evaluate(element => element.inert), true);
    await page.locator('#transaction-form [type="submit"]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#transaction-modal .btn-close').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#transaction-form [type="submit"]').evaluate(element => element === document.activeElement), true);
    await page.fill('#new-customer', 'Draft customer');
    await page.locator('#transaction-modal').click({ position: { x: 5, y: 5 } });
    assert.equal(await page.locator('#transaction-modal').isVisible(), true);
    assert.equal(await page.locator('#new-customer').inputValue(), 'Draft customer');
    await page.keyboard.press('Escape');
    await waitClosed('transaction-modal');
    assert.equal(await formTrigger.evaluate(element => element === document.activeElement), true);
    assert.equal(await page.locator('#new-customer').inputValue(), '');

    await page.locator('#overlays [data-bs-target="#reset-modal"]').click();
    await page.waitForFunction(() => document.activeElement.id === 'reset-cancel');
    await page.locator('#reset-modal').click({ position: { x: 5, y: 5 } });
    assert.equal(await page.locator('#reset-modal').isVisible(), true);
    assert.equal(await page.locator('#task-progress').getAttribute('aria-valuenow'), '40');
    await page.click('#reset-cancel');
    await waitClosed('reset-modal');

    const accountTrigger = page.locator('#overlays [data-bs-target="#account-modal"]');
    await accountTrigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'account-modal-title');
    await page.locator('#account-modal').click({ position: { x: 5, y: 5 } });
    await waitClosed('account-modal');
    assert.equal(await accountTrigger.evaluate(element => element === document.activeElement), true);
    const panelTrigger = page.locator('#overlays [data-bs-target="#notifications"]');
    await panelTrigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'notifications-title');
    assert.equal(await page.locator('.workspace').evaluate(element => element.inert), true);
    await page.keyboard.press('Escape');
    await waitClosed('notifications');
    assert.equal(await panelTrigger.evaluate(element => element === document.activeElement), true);

    await page.setViewportSize({ width: 390, height: 480 });
    await formTrigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'new-customer');
    const body = page.locator('#transaction-modal .modal-body');
    assert.equal(await body.evaluate(element => element.scrollHeight > element.clientHeight), true);
    for (const selector of ['.modal-header', '.modal-footer']) {
      assert.equal(await page.locator(`#transaction-modal ${selector}`).evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= innerHeight;
      }), true, `${selector} must remain visible on short screens`);
    }
    await body.hover();
    await page.mouse.wheel(0, 250);
    await page.waitForFunction(() => document.querySelector('#transaction-modal .modal-body').scrollTop > 0);
    assert.equal(await page.locator('#transaction-modal').evaluate(element => element.scrollWidth <= innerWidth), true);
    await page.keyboard.press('Escape');
    await waitClosed('transaction-modal');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await formTrigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'new-customer');
    assert.equal(await page.locator('#transaction-modal').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    await page.keyboard.press('Escape');
    await waitClosed('transaction-modal');
    assert.deepEqual(errors, []);
    console.log('Overlay checks passed: initial focus, Tab containment, inert background, safe backdrop dismissal, draft reset, focus restoration, scrolling, and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
