// Run with the local server and Playwright available: node checks/components.cjs
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const source = await browser.newPage();
    const errors = [];
    source.on('pageerror', error => errors.push(error.message));
    await source.goto(new URL('index.html', process.env.DASHBOARD_URL || 'http://127.0.0.1:8000/').href);
    await source.waitForFunction(() => document.querySelectorAll('.date-range-calendar').length === 2);
    const { markup, styles, scripts } = await source.evaluate(() => {
      const markup = [...document.querySelectorAll('#home > .dashboard-heading [data-date-range], #ui-elements, .modal, .offcanvas, .toast-container')].map(element => {
        const clone = element.cloneNode(true);
        clone.querySelectorAll('.date-range-calendar').forEach(node => node.remove());
        return clone.outerHTML;
      }).join('\n');
      return {
        markup,
        styles: [...document.querySelectorAll('link[rel="stylesheet"]')].map(element => element.outerHTML).join('\n'),
        scripts: [...document.querySelectorAll('script[src]')].filter(element => !element.src.endsWith('/demo.js')).map(element => element.outerHTML).join('\n')
      };
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-06T12:00:00'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setContent(`<!doctype html><html lang="en" data-bs-theme="dark"><head><base href="${source.url()}">${styles}</head><body><main class="container py-4"><button class="theme-toggle">Switch theme</button></main>${scripts}</body></html>`);
    await page.evaluate(markup => {
      const host = document.querySelector('main');
      host.insertAdjacentHTML('beforeend', markup);
      host.querySelectorAll('[data-date-range]').forEach(range => {
        const form = document.createElement('form'); range.before(form); form.append(range);
      });
      AdminUI.init(host); AdminUI.init(host); AdminUI.init(document.body);
    }, markup);
    assert.equal(await page.locator('.workspace, .sidebar, script[src="demo.js"]').count(), 0);
    assert.equal(await page.locator('body').evaluate(element => getComputedStyle(element).overflow), 'visible');
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), true);
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light', 'Repeated init toggles once');
    const first = page.locator('[data-date-range]').nth(0), second = page.locator('[data-date-range]').nth(1);
    const secondStart = await second.locator('[data-date-start]').inputValue();
    await first.evaluate(element => {
      window.dateEvents = [];
      element.addEventListener('datechange', event => window.dateEvents.push(event.detail));
    });
    await first.locator('.date-range-trigger').click();
    await first.locator('[data-calendar-date="2026-10-02"]').click();
    await first.locator('[data-calendar-date="2026-10-06"]').click();
    assert.deepEqual(await page.evaluate(() => window.dateEvents.at(-1)), { start: '2026-10-02', end: '2026-10-06', preset: null, label: '02 Oct 2026 - 06 Oct 2026' });
    assert.equal(await page.evaluate(() => window.dateEvents.length), 2);
    assert.equal(await second.locator('[data-date-start]').inputValue(), secondStart);
    assert.deepEqual(await first.evaluate(element => [...new FormData(element.closest('form')).entries()]), [['report_start', '2026-10-02'], ['report_end', '2026-10-06']]);
    await page.keyboard.press('Escape');
    await second.locator('.date-range-trigger').click();
    await second.locator('[data-calendar-date="2026-10-03"]').click();
    await second.locator('[data-calendar-date="2026-10-05"]').click();
    assert.equal(await second.locator('[data-date-label]').textContent(), '03 Oct 2026 - 05 Oct 2026');
    assert.deepEqual(await second.evaluate(element => [...new FormData(element.closest('form')).entries()]), [['start_date', '2026-10-03'], ['end_date', '2026-10-05']]);
    assert.equal(await first.locator('[data-date-start]').inputValue(), '2026-10-02');
    await page.keyboard.press('Escape');
    await page.locator('#demo-range').evaluate(input => { input.value = '75'; input.dispatchEvent(new Event('input')); });
    assert.equal(await page.locator('output[for="demo-range"]').textContent(), '75%');
    assert.equal(await page.locator('[data-indeterminate]').evaluate(input => input.indeterminate), true);
    await page.locator('[data-pagination] [data-page="3"]').click();
    assert.equal(await page.locator('[data-page-output]').textContent(), 'Page 3 of 3');
    await page.locator('#details-tab').click();
    assert.equal(await page.locator('#details-tab').getAttribute('aria-selected'), 'true');
    await page.locator('[data-bs-target="#demo-collapse"]').click();
    await page.waitForSelector('#demo-collapse.show');
    await page.locator('[data-bs-target="#demo-carousel"][data-bs-slide="next"]').click();
    await page.waitForFunction(() => document.querySelector('#demo-carousel .carousel-item.active').textContent.includes('Light or dark'));
    const trigger = page.locator('#overlays [data-bs-target="#transaction-modal"]');
    await trigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'new-customer');
    assert.equal(await page.locator('#ui-elements').evaluate(element => element.inert), true);
    await page.locator('#new-customer').fill('Draft');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#transaction-modal', { state: 'hidden' });
    await page.waitForSelector('.modal-backdrop', { state: 'hidden' });
    assert.equal(await page.locator('#new-customer').inputValue(), '');
    assert.equal(await page.locator('#ui-elements').evaluate(element => element.inert), false);
    assert.equal(await trigger.evaluate(element => element === document.activeElement), true);
    await page.evaluate(() => AdminUI.notify('Reusable toast'));
    assert.equal(await page.locator('[data-ui-toast] .toast-body').textContent(), 'Reusable toast');

    // The reusable script also initializes isolated markup without Bootstrap or demo data.
    const snippets = await source.locator('.dashboard-panel, [data-date-range], .modal, .offcanvas, .toast').evaluateAll(elements => elements.map(element => {
      const clone = element.cloneNode(true);
      clone.querySelectorAll('.date-range-calendar').forEach(node => node.remove());
      return clone.outerHTML;
    }));
    const isolated = await browser.newPage();
    isolated.on('pageerror', error => errors.push(error.message));
    await isolated.clock.setFixedTime(new Date('2026-10-06T12:00:00'));
    await isolated.setContent('<!doctype html><html lang="en" data-bs-theme="light"><body><main></main></body></html>');
    await isolated.addStyleTag({ path: path.resolve('style.css') });
    await isolated.addScriptTag({ path: path.resolve('script.js') });
    for (const html of snippets) {
      await isolated.evaluate(html => {
        const host = document.querySelector('main'); host.innerHTML = html;
        AdminUI.init(host); AdminUI.init(host.firstElementChild);
      }, html);
    }
    await isolated.evaluate(() => {
      const host = document.querySelector('main');
      host.innerHTML = '<div data-date-range><button type="button" class="date-range-trigger">Choose dates</button><input type="hidden" data-date-start value="2026-02-31"><input type="hidden" data-date-end value="2026-02-01"></div>';
      AdminUI.init(host);
    });
    await isolated.locator('.date-range-trigger').click();
    await isolated.locator('[data-calendar-date="2026-10-01"]').click();
    assert.equal(await isolated.locator('[data-date-start]').inputValue(), '2026-10-01');
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => AdminUI.setTheme(theme), theme);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
    }
    assert.deepEqual(errors, []);
    console.log(`Component checks passed: shell-free previews, repeated init, independent date events/forms, native controls, Bootstrap interactions, overlays, toasts, ${snippets.length} isolated components, themes, and mobile.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
