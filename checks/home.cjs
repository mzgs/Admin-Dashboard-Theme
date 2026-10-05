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
    const checkTableScrolling = async () => {
      const table = page.locator('#generic-table .table-container');
      await table.hover({ position: { x: 100, y: 100 } });
      const before = await page.locator('.dashboard-scroll').evaluate(element => element.scrollTop);
      await page.mouse.wheel(0, -200);
      await page.waitForFunction(top => document.querySelector('.dashboard-scroll').scrollTop < top, before);
      await page.waitForTimeout(300); // Let the wheel gesture finish before changing its target or direction.
      await table.hover({ position: { x: 100, y: 100 } });
      const after = await page.locator('.dashboard-scroll').evaluate(element => element.scrollTop);
      await page.mouse.wheel(0, 200);
      await page.waitForFunction(top => document.querySelector('.dashboard-scroll').scrollTop > top, after);
      await page.waitForTimeout(300);
      if (await table.evaluate(element => element.scrollWidth > element.clientWidth)) {
        await table.hover({ position: { x: 100, y: 100 } });
        await page.mouse.wheel(200, 0);
        await page.waitForFunction(() => document.querySelector('#generic-table .table-container').scrollLeft > 0);
      }
    };
    await page.goto(new URL('index.html', root).href);
    await page.waitForSelector('#transaction-rows .transaction-check');
    // Theme tokens must cover default, pressed, disabled, and keyboard-focus states.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const theme of ['dark', 'light']) {
      const mismatches = await page.evaluate(theme => {
        setTheme(theme);
        const probe = document.createElement('span');
        document.body.append(probe);
        const color = token => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color; };
        const failures = [];
        const check = (element, property, expected) => {
          if (getComputedStyle(element)[property] !== expected) failures.push(`${element.className}: ${property}`);
        };
        for (const [selector, background, foreground, border] of [
          ['.btn-primary', '--primary', '--primary-foreground', '--primary'],
          ['.btn-surface', '--surface', '--ink', '--line'],
          ['.btn-secondary', '--surface-raised', '--ink', null],
          ['.btn-ghost', null, '--ink', null],
          ['.btn-outline-danger', null, '--negative', '--negative']
        ]) {
          for (const button of document.querySelectorAll(selector)) {
            if (button.matches('.btn-check:checked + .btn')) {
              check(button, 'backgroundColor', color('--primary'));
              check(button, 'color', color('--primary-foreground'));
              continue;
            }
            const disabled = button.disabled;
            for (const state of [false, true]) {
              button.disabled = state;
              check(button, 'backgroundColor', background ? color(background) : 'rgba(0, 0, 0, 0)');
              check(button, 'color', color(foreground));
              check(button, 'borderTopColor', border ? color(border) : 'rgba(0, 0, 0, 0)');
            }
            button.disabled = disabled;
            if (!disabled) {
              button.classList.add('active');
              check(button, 'color', color(foreground));
              button.classList.remove('active');
            }
          }
        }
        const accordion = document.querySelector('.accordion-button');
        const icon = getComputedStyle(accordion, '::after').backgroundImage;
        accordion.classList.add('collapsed');
        if (getComputedStyle(accordion, '::after').backgroundImage !== icon) failures.push('Accordion icon palette');
        accordion.classList.remove('collapsed');
        probe.remove();
        return failures;
      }, theme);
      assert.deepEqual(mismatches, [], `${theme} component palette`);
      await page.locator('#demo-switch-off').focus();
      assert.doesNotMatch(await page.locator('#demo-switch-off').evaluate(element => getComputedStyle(element).backgroundImage), /86b7fe/);
      await page.locator('#demo-range').focus();
      assert.equal(await page.locator('#demo-range').evaluate(element => getComputedStyle(element).outlineWidth), '2px');
    }
    await page.evaluate(() => { setTheme('dark'); document.activeElement.blur(); });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const field = page.locator('#workspace-name');
    const settledStyle = (element, property) => Promise.all(element.getAnimations().map(animation => animation.finished))
      .then(() => getComputedStyle(element)[property]);
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => setTheme(theme), theme);
      const restingShadow = await field.evaluate(settledStyle, 'boxShadow');
      await field.evaluate(element => {
        element.transitions = [];
        element.ontransitionrun = event => element.transitions.push(event.propertyName);
      });
      await field.click();
      assert.match(await field.evaluate(settledStyle, 'boxShadow'), /3px/);
      assert.deepEqual(await field.evaluate(element => element.transitions.filter(property => ['border-top-color', 'box-shadow'].includes(property)).sort()), ['border-top-color', 'box-shadow'], `${theme} animated focus`);
      await field.evaluate(element => { element.transitions = []; });
      await page.locator('#preferences-title').click();
      assert.equal(await field.evaluate(element => element === document.activeElement), false, 'Outside click blurs input');
      assert.equal(await field.evaluate(settledStyle, 'boxShadow'), restingShadow);
      assert.deepEqual(await field.evaluate(element => element.transitions.filter(property => ['border-top-color', 'box-shadow'].includes(property)).sort()), ['border-top-color', 'box-shadow'], `${theme} animated blur`);
      await page.keyboard.press('Tab');
      for (const selector of ['#team-tab', '#demo-check-default', '#buttons .btn-primary']) {
        const control = page.locator(selector).first();
        await control.focus();
        assert.match(await control.evaluate(settledStyle, 'boxShadow'), /3px/, `${theme} keyboard focus on ${selector}`);
      }
      await page.locator('#demo-invalid').focus();
      assert.notEqual(await page.locator('#demo-invalid').evaluate(settledStyle, 'boxShadow'), await field.evaluate(element => {
        element.focus();
        return Promise.all(element.getAnimations().map(animation => animation.finished)).then(() => getComputedStyle(element).boxShadow);
      }), 'Invalid input keeps its error ring');
      await page.locator('#preferences-title').click();
    }
    await page.evaluate(() => { setTheme('dark'); document.activeElement.blur(); });
    const toggle = page.locator('#demo-switch-off');
    await toggle.evaluate(element => {
      element.transitions = [];
      element.ontransitionrun = event => element.transitions.push(event.propertyName);
    });
    await toggle.check();
    assert.equal(await toggle.evaluate(settledStyle, 'backgroundPositionX'), '100%');
    assert.ok(await toggle.evaluate(element => element.transitions.some(property => property.startsWith('background-position'))), 'Switch thumb animates');
    await toggle.uncheck();
    const menuTrigger = page.locator('#navigation [data-bs-toggle="dropdown"]');
    await menuTrigger.click();
    const menu = page.locator('#navigation .dropdown-menu');
    assert.equal(await menu.evaluate(element => getComputedStyle(element).animationName), 'menu-enter');
    await menu.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    await menuTrigger.press('ArrowDown');
    assert.equal(await menu.locator('.dropdown-item').first().evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await menu.isVisible(), false);
    assert.equal(await menuTrigger.evaluate(element => element === document.activeElement), true);
    await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
    await page.locator('#team-tab').focus();
    assert.equal(await page.locator('#team-tab').evaluate(element => getComputedStyle(element).outlineWidth), '2px');
    assert.notEqual(await page.locator('#team-tab').evaluate(element => getComputedStyle(element).outlineColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await field.evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    await menuTrigger.click();
    assert.equal(await menu.evaluate(element => getComputedStyle(element).animationName), 'none');
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });
    assert.equal(await page.locator('#transaction-rows tr').count(), 6);
    assert.equal(await page.locator('#home > .showcase-section').count(), 8);
    assert.equal(await page.locator('#home #generic-table').count(), 1);
    assert.equal(await page.locator('.showcase-index a').count(), 8);
    const ids = await page.locator('[id]').evaluateAll(elements => elements.map(element => element.id));
    assert.equal(new Set(ids).size, ids.length, 'Duplicate element IDs');
    await page.locator('#demo-range').evaluate(input => { input.value = '75'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    assert.equal(await page.locator('#range-value').textContent(), '75%');
    await page.check('#plan-pro');
    assert.equal(await page.locator('#plan-starter').isChecked(), false);
    assert.equal(await page.locator('#demo-check-mixed').evaluate(input => input.indeterminate), true);
    await page.click('label[for="view-grid"]');
    assert.equal(await page.locator('#view-grid').isChecked(), true);
    assert.equal(await page.locator('#view-list').isChecked(), false);
    assert.equal(await page.locator('#demo-select').inputValue(), '');
    await page.selectOption('#demo-select', 'engineering');
    assert.equal(await page.locator('#demo-select').inputValue(), 'engineering');
    await page.selectOption('#demo-multiple', ['Engineering', 'Marketing']);
    assert.equal(await page.locator('#demo-multiple option:checked').count(), 2);
    await page.click('[data-bs-target="#demo-collapse"]');
    await page.waitForSelector('#demo-collapse.show');
    await page.click('[data-bs-target="#demo-collapse"]');
    await page.waitForSelector('#demo-collapse', { state: 'hidden' });
    await page.click('[data-bs-target="#demo-carousel"][data-bs-slide="next"]');
    await page.waitForFunction(() => document.querySelector('#demo-carousel .carousel-item.active').textContent.includes('Light or dark'));
    await page.click('#feedback [data-bs-dismiss="alert"]');
    assert.equal(await page.locator('#feedback .alert-dismissible').count(), 0);
    await page.click('.demo-pagination [data-page="3"]');
    assert.equal(await page.locator('#demo-page-content').textContent(), 'Example page 3 of 3');
    assert.equal(await page.locator('.demo-pagination [data-page="next"]').isDisabled(), true);
    await page.click('.demo-pagination [data-page="previous"]');
    assert.equal(await page.locator('.demo-pagination [aria-current="page"]').textContent(), '2');
    await page.click('.demo-pagination [data-page="1"]');
    assert.equal(await page.locator('.demo-pagination [data-page="previous"]').isDisabled(), true);
    await page.click('[data-bs-toggle="popover"]');
    await page.waitForSelector('.popover.show');
    await page.locator('[data-bs-toggle="popover"]').press('Tab');
    await page.waitForSelector('.popover', { state: 'hidden' });
    await page.locator('#overlays [data-bs-toggle="tooltip"]').focus();
    await page.waitForSelector('.tooltip.show');
    await page.locator('#overlays [data-bs-toggle="tooltip"]').press('Tab');
    await page.waitForSelector('.tooltip', { state: 'hidden' });
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
    await page.waitForSelector('.modal-backdrop', { state: 'hidden' });
    // A confirmation may be clicked before Bootstrap finishes opening the dialog.
    await page.evaluate(() => {
      document.querySelector('[data-bs-target="#reset-modal"]').click();
      document.querySelector('#reset-tasks').click();
    });
    await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
    await page.waitForSelector('#reset-modal', { state: 'hidden' });
    assert.equal(await page.locator('#task-progress').getAttribute('aria-valuenow'), '0');
    await page.evaluate(() => {
      document.querySelector('#overlays [data-bs-target="#account-modal"]').click();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
    assert.equal(await page.locator('.modal-backdrop').count(), 0);
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

    for (const width of [1440, 1024, 768, 575, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const period of ['month', 'year']) {
        await page.selectOption('#report-period', period);
        const overflow = await page.locator('.metric-value, .swatch-grid > div').evaluateAll(elements => elements
          .filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent.trim()));
        assert.deepEqual(overflow, [], `Clipped component content at ${width}px (${period})`);
      }
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
    for (const link of await page.locator('.sidebar-nav a').all()) {
      const href = await link.getAttribute('href');
      assert.ok(href.startsWith('#'));
      assert.equal(await page.locator(href).count(), 1);
      await link.click();
      await page.waitForURL(url => url.hash === href);
      await page.waitForFunction(target => document.querySelector(`.sidebar-nav a[href="${target}"]`).getAttribute('aria-current') === 'location', href);
    }
    await page.click('.sidebar-nav a[href="#generic-table"]');
    assert.equal(await page.locator('#generic-table tbody tr').count(), 24);
    assert.equal(await page.locator('#generic-table').evaluate(element => {
      const scroll = document.querySelector('.dashboard-scroll').getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      return rect.top >= scroll.top && rect.top < scroll.bottom;
    }), true);
    await checkTableScrolling();
    await page.reload();
    assert.equal(await page.locator('.sidebar-nav a[href="#generic-table"]').getAttribute('aria-current'), 'location');
    await page.click('.sidebar-nav a[href="#home"]');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('.mobile-menu');
    await page.click('.sidebar-nav a[href="#generic-table"]');
    assert.equal(await page.locator('body').evaluate(body => body.classList.contains('sidebar-mobile-open')), false);
    await checkTableScrolling();
    assert.deepEqual(errors, []);
    console.log('Dashboard browser checks passed: animated focus/blur, keyboard rings, switch motion, dropdown keyboard navigation, forced colors, reduced motion, component groups, range, selections, pagination, carousel, collapse, alerts, tooltip, popover, charts, filters, transaction pagination, safe form rendering, export, tasks, tabs, persistence, theme states, responsive content, navigation, and generic table scrolling.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
