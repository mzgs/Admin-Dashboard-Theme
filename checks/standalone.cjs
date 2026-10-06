// Run with the local server and Playwright available: node checks/standalone.cjs
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-10-06T12:00:00'));
    await page.goto(new URL('standalone.html', process.env.DASHBOARD_URL || 'http://127.0.0.1:8000/').href);
    await page.waitForFunction(() => document.querySelectorAll('.date-range-calendar').length === 2);
    assert.equal(await page.locator('.workspace, .sidebar, script[src="demo.js"]').count(), 0);
    assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).overflow), 'visible');
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), true, 'Ordinary document scrolling');
    assert.equal(await page.locator('#transaction-rows, #date-range-trigger, #workspace-name').count(), 0, 'No showcase IDs');
    const codeExamples = page.locator('details.example-code');
    assert.equal(await codeExamples.count(), await page.locator('.dashboard-panel, .transaction-panel, .date-example').count() + 1, 'Every example plus page setup has code');
    assert.equal(await page.locator('details.example-code[open]').count(), 0, 'Code starts collapsed');
    const disclosure = codeExamples.nth(1);
    await disclosure.locator('summary').focus();
    await page.keyboard.press('Enter');
    assert.equal(await disclosure.locator('pre').isVisible(), true, 'Keyboard opens code');
    await page.keyboard.press('Enter');
    assert.equal(await disclosure.locator('pre').isVisible(), false, 'Keyboard closes code');
    const documentedHtml = await codeExamples.locator('pre[aria-label="HTML example"] code').allTextContents();
    const pageSource = await (await page.request.get(page.url())).text();
    await page.evaluate(({ pageSource, documentedHtml }) => {
      const original = new DOMParser().parseFromString(pageSource, 'text/html');
      const normalize = html => html.replace(/>\s+</g, '><').trim();
      [...original.querySelectorAll('.example-code')].slice(1).forEach((disclosure, index) => {
        const preview = disclosure.closest('.dashboard-panel, .transaction-panel, .date-example');
        const source = preview.matches('.date-example') ? preview.querySelector('form') : preview;
        const expected = source.cloneNode(true);
        expected.querySelectorAll('.example-code').forEach(element => element.remove());
        const template = document.createElement('template');
        template.innerHTML = documentedHtml[index + 1];
        if (normalize(template.content.firstElementChild.outerHTML) !== normalize(expected.outerHTML)) {
          throw new Error(`Code does not match preview: ${preview.querySelector('h3')?.textContent || preview.querySelector('form').ariaLabel}`);
        }
      });
    }, { pageSource, documentedHtml });
    await page.evaluate(htmlExamples => {
      for (const html of htmlExamples) {
        const template = document.createElement('template');
        template.innerHTML = html;
        const root = template.content;
        for (const element of root.querySelectorAll('[for], [aria-labelledby], [aria-describedby], [aria-controls], [list], [data-bs-target], [data-bs-parent], [data-toast-target]')) {
          for (const attribute of ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'list', 'data-bs-target', 'data-bs-parent', 'data-toast-target']) {
            for (const id of (element.getAttribute(attribute) || '').replace(/^#/, '').split(/\s+/).filter(Boolean)) {
              if (!root.getElementById(id)) throw new Error(`Missing ${attribute} target ${id} in code example`);
            }
          }
        }
      }
    }, documentedHtml);
    await page.evaluate(() => { AdminUI.init(); AdminUI.init(document.body); });
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-bs-theme'), 'light', 'Theme must toggle once');
    const ranges = page.locator('[data-date-range]'), first = ranges.nth(0), second = ranges.nth(1);
    const secondStart = await second.locator('[data-date-start]').inputValue();
    await page.evaluate(() => {
      window.dateEvents = [];
      document.querySelector('[data-date-range]').addEventListener('datechange', e => window.dateEvents.push(e.detail));
    });
    await first.locator('.date-range-trigger').click();
    await first.locator('[data-calendar-date="2026-10-02"]').click();
    await first.locator('[data-calendar-date="2026-10-06"]').click();
    assert.deepEqual(await page.evaluate(() => window.dateEvents.at(-1)), { start: '2026-10-02', end: '2026-10-06', preset: null, label: '02 Oct 2026 - 06 Oct 2026' });
    assert.equal(await page.evaluate(() => window.dateEvents.length), 2, 'One event per selection after repeated init');
    assert.equal(await second.locator('[data-date-start]').inputValue(), secondStart, 'Pickers are independent');
    assert.deepEqual(await first.evaluate(el => [...new FormData(el.closest('form')).entries()]), [['report_start', '2026-10-02'], ['report_end', '2026-10-06']]);
    await page.keyboard.press('Escape');
    assert.equal(await second.locator('[data-report-period]').count(), 0, 'Standalone picker has no preset group');
    assert.equal(await second.locator('[data-date-label]').textContent(), 'Choose dates');
    await second.locator('.date-range-trigger').click();
    await second.locator('[data-calendar-date="2026-10-03"]').click();
    await second.locator('[data-calendar-date="2026-10-05"]').click();
    assert.equal(await second.locator('[data-date-label]').textContent(), '03 Oct 2026 - 05 Oct 2026');
    assert.deepEqual(await second.evaluate(el => [...new FormData(el.closest('form')).entries()]), [['invoice_start', '2026-10-03'], ['invoice_end', '2026-10-05']]);
    assert.equal(await first.locator('[data-date-start]').inputValue(), '2026-10-02');
    await second.locator('[data-calendar-date="2026-10-05"]').click();
    await second.locator('[data-calendar-date="2026-10-05"]').click();
    assert.equal(await second.locator('[data-date-label]').textContent(), 'Choose dates', 'Clearing restores the placeholder');
    await page.keyboard.press('Escape');
    await page.locator('#portable-demo-range').evaluate(input => { input.value = '75'; input.dispatchEvent(new Event('input')); });
    assert.equal(await page.locator('output[for="portable-demo-range"]').textContent(), '75%');
    assert.equal(await page.locator('[data-indeterminate]').evaluate(input => input.indeterminate), true);
    await page.evaluate(() => {
      window.pageEvents = 0;
      document.querySelector('[data-pagination]').addEventListener('pagechange', () => window.pageEvents++);
    });
    await page.locator('[data-pagination] [data-page="3"]').click();
    assert.equal(await page.locator('[data-page-output]').textContent(), 'Page 3 of 3');
    assert.equal(await page.evaluate(() => window.pageEvents), 1);
    const table = page.locator('[data-table]').first();
    assert.equal(await table.locator('tbody tr:not([hidden])').count(), 2);
    await table.locator('[data-table-page="next"]').click();
    assert.equal(await table.locator('tbody tr:not([hidden])').textContent(), 'GraceDesign');
    await table.locator('[data-table-filter]').selectOption('Design');
    await table.locator('[data-table-select-all]').check();
    assert.equal(await table.locator('[data-table-row-select]:checked').count(), 2);
    await table.locator('[data-table-search]').fill('Ada');
    assert.equal(await table.locator('tbody tr:not([hidden])').count(), 1);
    await table.locator('[data-table-search]').fill('Nobody');
    assert.equal(await table.locator('[data-table-empty]').isVisible(), true);
    assert.equal(await table.locator('[data-table-select-all]').isDisabled(), true);
    await table.locator('[data-table-search]').fill('');
    await page.evaluate(() => {
      const original = document.querySelector('[data-table]');
      const clone = original.cloneNode(true);
      clone.querySelector('[data-table-empty]').remove();
      clone.querySelector('[data-table-search]').value = '';
      clone.querySelector('[data-table-filter]').value = 'all';
      document.querySelector('main').append(clone);
      AdminUI.init(clone);
    });
    const otherTable = page.locator('[data-table]').nth(1);
    await otherTable.locator('[data-table-search]').fill('Linus');
    assert.equal(await otherTable.locator('tbody tr:not([hidden])').count(), 1);
    assert.equal(await table.locator('tbody tr:not([hidden])').count(), 2);
    await otherTable.evaluate(el => {
      const row = document.createElement('tr'); row.dataset.team = 'Design';
      row.innerHTML = '<td></td><td>Margaret</td><td>Design</td>';
      el.querySelector('tbody').append(row);
      el.querySelector('[data-table-search]').value = 'Margaret';
      el.dispatchEvent(new Event('tableupdate'));
    });
    assert.equal(await otherTable.locator('tbody tr:not([hidden])').textContent(), 'MargaretDesign');
    await page.locator('[data-checklist] input').first().uncheck();
    assert.equal(await page.locator('[data-checklist-progress]').getAttribute('aria-valuenow'), '20');
    await page.locator('[data-segment] [data-value="orders"]').click();
    assert.equal(await page.locator('[data-segment] [data-value="orders"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-segment] [data-value="orders"]').press('ArrowLeft');
    assert.equal(await page.locator('[data-segment] [data-value="revenue"]').getAttribute('aria-pressed'), 'true');
    await page.locator('#portable-details-tab').click();
    assert.equal(await page.locator('#portable-details-tab').getAttribute('aria-selected'), 'true');
    await page.locator('#portable-navigation [data-bs-toggle="dropdown"]').click();
    await page.locator('#portable-navigation [data-bs-toggle="dropdown"]').press('ArrowDown');
    assert.equal(await page.locator('#portable-navigation .dropdown-item').first().evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    await page.locator('[data-bs-target="#portable-demo-collapse"]').click();
    await page.waitForSelector('#portable-demo-collapse.show');
    await page.locator('#portable-overlays [data-bs-toggle="popover"]').click();
    await page.waitForSelector('.popover.show');
    await page.locator('#portable-overlays [data-bs-toggle="popover"]').press('Tab');
    await page.waitForSelector('.popover', { state: 'hidden' });
    await page.locator('#portable-overlays [data-bs-toggle="tooltip"]').focus();
    await page.waitForSelector('.tooltip.show');
    await page.locator('#portable-overlays [data-bs-toggle="tooltip"]').press('Tab');
    await page.waitForSelector('.tooltip', { state: 'hidden' });
    await page.locator('[data-bs-target="#portable-demo-carousel"][data-bs-slide="next"]').click();
    await page.waitForFunction(() => document.querySelector('#portable-demo-carousel .carousel-item.active').textContent.includes('Light or dark'));
    await page.locator('#portable-feedback [data-bs-dismiss="alert"]').click();
    assert.equal(await page.locator('#portable-feedback .alert-dismissible').count(), 0);
    const trigger = page.locator('#portable-overlays [data-bs-target="#portable-transaction-modal"]');
    await trigger.click();
    await page.waitForFunction(() => document.activeElement.id === 'portable-new-customer');
    assert.equal(await page.locator('#portable-foundations').evaluate(el => el.inert), true, 'Background inside an ordinary main is inert');
    await page.locator('#portable-new-customer').fill('Draft');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#portable-transaction-modal', { state: 'hidden' });
    await page.waitForSelector('.modal-backdrop', { state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('#portable-new-customer').value === '');
    assert.equal(await page.locator('#portable-new-customer').inputValue(), '');
    assert.equal(await page.locator('#portable-foundations').evaluate(el => el.inert), false);
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
    await page.locator('#portable-overlays [data-bs-target="#portable-notifications"]').click();
    await page.waitForSelector('#portable-notifications.show');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#portable-notifications', { state: 'hidden' });
    await page.evaluate(() => AdminUI.notify('Standalone toast'));
    assert.equal(await page.locator('[data-ui-toast] .toast-body').textContent(), 'Standalone toast');
    await page.evaluate(() => {
      const button = document.querySelector('[data-notify]');
      button.setAttribute('data-bs-toggle', 'tooltip');
      button.setAttribute('data-bs-title', 'Combined behaviors');
      AdminUI.init(button); AdminUI.init(button);
    });
    const combined = page.locator('[data-notify]').first();
    await combined.focus();
    await page.waitForSelector('.tooltip.show');
    await combined.press('Enter');
    assert.equal(await page.locator('[data-ui-toast] .toast-body').textContent(), await combined.getAttribute('data-notify'));
    await combined.press('Tab');
    await page.waitForSelector('.tooltip', { state: 'hidden' });
    assert.equal(await page.locator('[data-pagination] [data-page="2"]').getAttribute('type'), 'button');
    // Load the shared script on an empty page without Bootstrap, then mount each
    // copied component individually. No demo nodes may be required to initialize.
    const snippets = await page.locator('.dashboard-panel, .metric-card, [data-date-range], [data-table], .modal, .offcanvas, .toast').evaluateAll(elements => elements.map(element => {
      const clone = element.cloneNode(true);
      clone.querySelectorAll('.date-range-calendar, [data-table-empty]').forEach(node => node.remove());
      return clone.outerHTML;
    }));
    const isolated = await browser.newPage();
    isolated.on('pageerror', error => errors.push(error.message));
    await isolated.setContent('<!doctype html><html lang="en" data-bs-theme="light"><body><main></main></body></html>');
    await isolated.addStyleTag({ path: path.resolve('style.css') });
    await isolated.addScriptTag({ path: path.resolve('script.js') });
    assert.equal(await isolated.evaluate(() => typeof AdminUI.init), 'function');
    for (const html of documentedHtml.slice(1)) {
      await isolated.evaluate(html => {
        const host = document.querySelector('main');
        host.innerHTML = html;
        AdminUI.init(host);
      }, html);
    }
    for (const html of snippets) {
      await isolated.evaluate(html => {
        const host = document.querySelector('main');
        host.innerHTML = html;
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
    assert.equal(await isolated.locator('[data-date-start]').inputValue(), '2026-10-01', 'Invalid initial date is ignored');
    await codeExamples.evaluateAll(elements => elements.forEach(element => { element.open = true; }));
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => AdminUI.setTheme(theme), theme);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Standalone overflow at ${width}px (${theme})`);
      }
    }
    assert.deepEqual(errors, []);
    console.log(`Standalone checks passed: ${documentedHtml.length} code examples, keyboard disclosures, copied references, ${snippets.length} isolated components, empty page without Bootstrap, repeat init, date instances/events/forms, tables, checklist, pagination, segments, native inputs, Bootstrap interactions, nested overlays, themes, and mobile with code expanded.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
