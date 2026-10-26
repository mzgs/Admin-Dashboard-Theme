'use strict';

// Shared components and the dashboard demo. The component showcase uses demo.js.
(() => {
  const initialized = new WeakMap();
  const openingModals = new Set();
  let nextId = 0;
  const calendars = new WeakMap();
  const reflowCalendars = () => document.querySelectorAll('.date-range-calendar:popover-open').forEach(calendar => calendars.get(calendar)?.());
  window.addEventListener('resize', reflowCalendars);
  document.addEventListener('scroll', reflowCalendars, true);
  const identify = (element, prefix) => {
    if (!element.id) {
      let id;
      do { id = `${prefix}-${++nextId}`; } while (document.getElementById(id));
      element.id = id;
    }
    return element.id;
  };
  const asButton = element => {
    if (element?.tagName === 'BUTTON' && !element.hasAttribute('type')) element.type = 'button';
  };
  const setTheme = theme => {
    theme = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.bsTheme = theme;
    const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    document.querySelectorAll('.theme-toggle, [data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', label);
      button.title = label;
      const icon = button.querySelector('i');
      if (icon) icon.className = `fa-light fa-${theme === 'dark' ? 'sun' : 'moon'}`;
    });
  };
  const notify = (message, target = document.querySelector('[data-ui-toast]')) => {
    if (typeof target === 'string') target = document.getElementById(target.replace(/^#/, ''));
    const body = target?.querySelector('.toast-body');
    if (body) body.textContent = message;
    if (target && window.bootstrap) bootstrap.Toast.getOrCreateInstance(target).show();
    document.dispatchEvent(new CustomEvent('uinotify', { detail: { message, target } }));
  };
  const hideModal = modal => {
    if (!modal || !window.bootstrap) return;
    const hide = () => bootstrap.Modal.getOrCreateInstance(modal).hide();
    if (openingModals.has(modal)) modal.addEventListener('shown.bs.modal', hide, { once: true });
    else hide();
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') openingModals.forEach(hideModal);
  });
  const initOverlay = overlay => {
    const kind = overlay.classList.contains('modal') ? 'modal' : 'offcanvas';
    let background = new Map(), trigger;
    overlay.addEventListener(`show.bs.${kind}`, () => {
      if (kind === 'modal') openingModals.add(overlay);
      trigger = document.activeElement;
      background = new Map();
      // Inert siblings at each level so dialogs also work inside ordinary page layouts.
      for (let branch = overlay; branch && branch !== document.body; branch = branch.parentElement) {
        for (const element of branch.parentElement?.children || []) {
          if (element === branch || element.matches('script, style, .modal-backdrop, .offcanvas-backdrop')) continue;
          background.set(element, element.inert);
          element.inert = true;
        }
      }
    });
    overlay.addEventListener(`shown.bs.${kind}`, () => {
      openingModals.delete(overlay);
      const focus = overlay.querySelector('[data-initial-focus]') || overlay.querySelector('form input:not(:disabled), form select:not(:disabled), form textarea:not(:disabled)') || overlay.querySelector('.modal-title, .offcanvas-title');
      if (focus && !focus.matches('input, select, textarea, button, a[href], [tabindex]')) focus.tabIndex = -1;
      focus?.focus({ preventScroll: true });
    });
    overlay.addEventListener(`hidden.bs.${kind}`, () => {
      background.forEach((inert, element) => { element.inert = inert; });
      background.clear();
      if (overlay.hasAttribute('data-reset-on-close')) overlay.querySelectorAll('form').forEach(form => form.reset());
      if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true });
    });
    if (kind === 'modal') overlay.addEventListener('click', event => {
      const backdropDismiss = event.target === overlay && overlay.dataset.bsBackdrop !== 'static';
      if (openingModals.has(overlay) && (backdropDismiss || event.target.closest('[data-bs-dismiss="modal"]'))) hideModal(overlay);
    });
    overlay.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...overlay.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
        .filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!first || (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    });
  };
  const initSidebar = layout => {
    const sidebar = layout.querySelector('.sidebar');
    if (!sidebar) return;
    const mobile = layout.querySelector('.mobile-menu');
    const toggle = sidebar.querySelector('.sidebar-toggle');
    asButton(mobile); asButton(toggle);
    const close = () => { layout.classList.remove('sidebar-mobile-open'); mobile?.setAttribute('aria-expanded', 'false'); };
    toggle?.addEventListener('click', () => {
      if (matchMedia('(max-width: 767px)').matches) { close(); return; }
      const expanded = layout.classList.toggle('sidebar-expanded');
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? 'Collapse navigation' : 'Expand navigation');
      toggle.title = expanded ? 'Collapse navigation' : 'Expand navigation';
      if (!expanded && window.bootstrap) sidebar.querySelectorAll('.collapse').forEach(section => bootstrap.Collapse.getOrCreateInstance(section, { toggle: false }).show());
    });
    mobile?.addEventListener('click', () => {
      layout.classList.add('sidebar-expanded');
      mobile.setAttribute('aria-expanded', String(layout.classList.toggle('sidebar-mobile-open')));
      toggle?.setAttribute('aria-expanded', 'true');
      toggle?.setAttribute('aria-label', 'Collapse navigation');
    });
    layout.querySelector('.workspace')?.addEventListener('click', event => { if (!event.target.closest('.mobile-menu')) close(); });
    sidebar.addEventListener('click', event => { if (event.target.closest('a[href]')) close(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    const links = [...sidebar.querySelectorAll('a[href^="#"]')];
    const update = () => {
      const target = location.hash || links[0]?.getAttribute('href');
      links.forEach(link => {
        const active = link.getAttribute('href') === target;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('hashchange', update);
    update();
  };
  const initPagination = root => {
    const buttons = [...root.querySelectorAll('[data-page]')];
    buttons.forEach(asButton);
    const total = Math.max(1, ...buttons.map(button => Number(button.dataset.page) || 0));
    let page = Number(root.querySelector('[aria-current="page"]')?.dataset.page) || 1;
    const update = () => {
      const output = root.querySelector('[data-page-output]');
      if (output) output.textContent = `Page ${page} of ${total}`;
      buttons.forEach(button => {
        const active = Number(button.dataset.page) === page;
        button.parentElement.classList.toggle('active', active);
        if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
        button.disabled = (button.dataset.page === 'previous' && page === 1) || (button.dataset.page === 'next' && page === total);
        button.parentElement.classList.toggle('disabled', button.disabled);
      });
    };
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || !root.contains(button) || button.disabled) return;
      const value = button.dataset.page;
      page = Math.max(1, Math.min(total, value === 'next' ? page + 1 : value === 'previous' ? page - 1 : Number(value) || page));
      update();
      root.dispatchEvent(new CustomEvent('pagechange', { bubbles: true, detail: { page, total } }));
    });
    update();
  };
  const initSegment = root => {
    const buttons = [...root.querySelectorAll('[data-value]')];
    buttons.forEach(asButton);
    const select = button => {
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      root.dispatchEvent(new CustomEvent('segmentchange', { bubbles: true, detail: { value: button.dataset.value } }));
    };
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-value]');
      if (buttons.includes(button) && !button.disabled) select(button);
    });
    root.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const enabled = buttons.filter(button => !button.disabled), index = enabled.indexOf(event.target);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? enabled[0] : event.key === 'End' ? enabled.at(-1) : enabled[(index + (event.key === 'ArrowLeft' ? -1 : 1) + enabled.length) % enabled.length];
      next.focus(); select(next);
    });
  };
  const makeCalendar = (root, trigger) => {
    const calendar = document.createElement('div');
    calendar.className = 'date-range-calendar';
    calendar.setAttribute('popover', 'auto');
    calendar.setAttribute('role', 'dialog');
    calendar.setAttribute('aria-label', 'Select custom date range');
    calendar.innerHTML = '<p class="visually-hidden" data-calendar-help>Choose a start and end date. Use arrow keys to move by day, Page Up and Page Down to move by month, and Escape to close.</p><div class="date-range-caption"><button type="button" class="btn btn-ghost icon-button" data-calendar-month="-1" aria-label="Go to the Previous Month">‹</button><span data-calendar-caption aria-live="polite"></span><button type="button" class="btn btn-ghost icon-button" data-calendar-month="1" aria-label="Go to the Next Month">›</button></div><table class="date-range-grid" role="grid"><thead><tr><th scope="col" abbr="Sunday">Su</th><th scope="col" abbr="Monday">Mo</th><th scope="col" abbr="Tuesday">Tu</th><th scope="col" abbr="Wednesday">We</th><th scope="col" abbr="Thursday">Th</th><th scope="col" abbr="Friday">Fr</th><th scope="col" abbr="Saturday">Sa</th></tr></thead><tbody></tbody></table>';
    root.append(calendar);
    trigger.setAttribute('popovertarget', identify(calendar, 'ui-calendar'));
    trigger.setAttribute('aria-controls', calendar.id);
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    calendar.setAttribute('aria-describedby', identify(calendar.querySelector('[data-calendar-help]'), 'ui-calendar-help'));
    calendar.querySelector('table').setAttribute('aria-labelledby', identify(calendar.querySelector('[data-calendar-caption]'), 'ui-calendar-caption'));
    return calendar;
  };
  const initDateRange = root => {
    const find = selector => root.querySelector(selector);
    const all = selector => [...root.querySelectorAll(selector)];
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const dateKey = date => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const readDate = value => new Date(`${value}T12:00:00`);
    const shiftDate = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
    const dateLabel = date => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const rangeLabel = (start, end) => `${dateLabel(start)} - ${dateLabel(end)}`;
    const trigger = find('.date-range-trigger');
    if (!trigger) return;
    asButton(trigger);
    all('[data-report-period]').forEach(asButton);
    const visibleLabel = trigger.querySelector('[data-date-label]');
    const placeholder = visibleLabel?.textContent || 'Choose dates';
    const calendar = makeCalendar(root, trigger);
    const startInput = find('[data-date-start]'), endInput = find('[data-date-end]');
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && dateKey(readDate(value)) === value;
    let rangeStart = validDate(startInput?.value) ? startInput.value : undefined;
    let rangeEnd = validDate(endInput?.value) ? endInput.value : rangeStart;
    if (rangeStart && rangeEnd < rangeStart) [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
    let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
    let calendarFocus = dateKey(today);
    const positionCalendar = () => {
      const rect = trigger.getBoundingClientRect();
      calendar.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - calendar.offsetWidth - 8))}px`;
      calendar.style.top = `${Math.max(8, rect.bottom + calendar.offsetHeight + 4 <= innerHeight ? rect.bottom + 4 : rect.top - calendar.offsetHeight - 4)}px`;
    };
    const renderCalendar = (focus = false) => {
      calendar.querySelector('[data-calendar-caption]').textContent = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const first = shiftDate(calendarMonth, -calendarMonth.getDay());
      const days = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
      const weeks = Math.ceil((calendarMonth.getDay() + days) / 7);
      calendar.querySelector('tbody').innerHTML = Array.from({ length: weeks }, (_, week) => `<tr>${Array.from({ length: 7 }, (_, day) => {
        const date = shiftDate(first, week * 7 + day), key = dateKey(date);
        const selected = !!rangeStart && key >= rangeStart && key <= rangeEnd;
        const start = key === rangeStart, end = key === rangeEnd;
        const isToday = key === dateKey(today);
        const classes = [selected ? 'in-range' : '', start ? 'range-start' : '', end ? 'range-end' : '', date.getMonth() !== calendarMonth.getMonth() ? 'outside-month' : ''].join(' ');
        return `<td class="${classes}" aria-selected="${selected}"><button type="button" data-calendar-date="${key}" tabindex="${key === calendarFocus ? 0 : -1}" ${isToday ? 'aria-current="date"' : ''} aria-label="${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}">${date.getDate()}</button></td>`;
      }).join('')}</tr>`).join('');
      if (focus) calendar.querySelector(`[data-calendar-date="${calendarFocus}"]`)?.focus();
      if (calendar.matches(':popover-open')) positionCalendar();
    };
    const commit = (preset = null) => {
      const custom = !preset && !!rangeStart;
      const start = preset ? dateKey(shiftDate(today, { day: 0, week: -6, month: -29 }[preset])) : rangeStart || null;
      const end = preset ? dateKey(today) : rangeEnd || null;
      const label = start ? preset === 'day' ? `Last 24 hours · ${dateLabel(today)}` : rangeLabel(readDate(start), readDate(end)) : 'Custom range cleared';
      all('[data-report-period]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.reportPeriod === preset)));
      if (visibleLabel) visibleLabel.textContent = start ? label : placeholder;
      trigger.setAttribute('aria-label', visibleLabel ? start ? label : placeholder : custom ? label : 'Select custom range');
      trigger.title = custom ? label : 'Select custom range';
      const dot = find('.date-range-dot');
      if (dot) dot.hidden = !custom;
      const status = find('[data-date-status]');
      if (status) status.textContent = label;
      if (startInput) startInput.value = start || '';
      if (endInput) endInput.value = end || '';
      root.dispatchEvent(new CustomEvent('datechange', { bubbles: true, detail: { start, end, preset, label } }));
    };
    const setPreset = period => {
      if (!['day', 'week', 'month'].includes(period)) return;
      rangeStart = rangeEnd = undefined;
      calendar.hidePopover();
      commit(period);
    };
    all('[data-report-period]').forEach(button => button.addEventListener('click', () => setPreset(button.dataset.reportPeriod)));
    calendar.addEventListener('toggle', event => {
      const open = event.newState === 'open';
      trigger.setAttribute('aria-expanded', String(open));
      if (open) {
        const date = rangeStart ? readDate(rangeStart) : today;
        calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12);
        calendarFocus = dateKey(date);
        renderCalendar();
        calendar.querySelector('[data-calendar-month="-1"]').focus();
      }
    });
    calendar.addEventListener('click', event => {
      const month = event.target.closest('[data-calendar-month]');
      if (month) {
        calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + Number(month.dataset.calendarMonth), 1, 12);
        calendarFocus = dateKey(calendarMonth);
        renderCalendar();
        return;
      }
      const button = event.target.closest('[data-calendar-date]');
      if (!button) return;
      const key = button.dataset.calendarDate;
      if (key === rangeStart && key === rangeEnd) {
        rangeStart = rangeEnd = undefined;
        commit();
        renderCalendar(true);
        return;
      }
      if (!rangeStart || key === rangeEnd) rangeStart = rangeEnd = key;
      else if (key < rangeStart) rangeStart = key;
      else rangeEnd = key;
      calendarFocus = key;
      commit();
      renderCalendar(true);
    });
    calendar.addEventListener('keydown', event => {
      const button = event.target.closest('[data-calendar-date]');
      if (!button) return;
      const date = readDate(button.dataset.calendarDate);
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -date.getDay(), End: 6 - date.getDay() };
      let next;
      if (event.key in offsets) next = shiftDate(date, offsets[event.key]);
      else if (event.key === 'PageUp' || event.key === 'PageDown') {
        next = new Date(date.getFullYear(), date.getMonth() + (event.key === 'PageUp' ? -1 : 1), 1, 12);
        next.setDate(Math.min(date.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      } else return;
      event.preventDefault();
      calendarFocus = dateKey(next);
      calendarMonth = new Date(next.getFullYear(), next.getMonth(), 1, 12);
      renderCalendar(true);
    });
    calendars.set(calendar, () => {
      const rect = trigger.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) calendar.hidePopover();
      else positionCalendar();
    });
    if (rangeStart) commit();
    else {
      const preset = root.dataset.datePreset || find('[data-report-period][aria-pressed="true"]')?.dataset.reportPeriod;
      if (preset) setPreset(preset); else commit();
    }


  };
  const initTable = root => {
    const table = root.querySelector('table'), body = table?.tBodies[0];
    if (!body) return;
    const search = root.querySelector('[data-table-search]');
    const filters = [...root.querySelectorAll('[data-table-filter]')];
    const selectAll = root.querySelector('[data-table-select-all]');
    const previous = root.querySelector('[data-table-page="previous"]'), next = root.querySelector('[data-table-page="next"]');
    const requestedSize = Number(root.dataset.tablePageSize);
    asButton(previous); asButton(next);
    const size = Number.isSafeInteger(requestedSize) && requestedSize > 0 ? requestedSize : Number.MAX_SAFE_INTEGER;
    let page = 0;
    const empty = document.createElement('tr');
    empty.setAttribute('data-table-empty', '');
    const cell = document.createElement('td');
    cell.className = 'empty-state';
    cell.colSpan = table.tHead?.rows[0]?.cells.length || 1;
    cell.textContent = 'No records match your filters.';
    empty.append(cell);
    const update = () => {
      const rows = [...body.rows].filter(row => !row.hasAttribute('data-table-empty'));
      const query = (search?.value || '').trim().toLowerCase();
      const matches = rows.filter(row => row.textContent.toLowerCase().includes(query) && filters.every(filter => !filter.value || filter.value === 'all' || row.dataset[filter.dataset.tableFilter] === filter.value));
      const pages = Math.max(1, Math.ceil(matches.length / size));
      page = Math.min(page, pages - 1);
      const visible = matches.slice(page * size, (page + 1) * size);
      const matched = new Set(matches), shown = new Set(visible);
      rows.forEach(row => { row.hidden = !shown.has(row); row.dataset.tableMatch = String(matched.has(row)); });
      const checks = visible.flatMap(row => [...row.querySelectorAll('[data-table-row-select]:not(:disabled)')]);
      if (selectAll) {
        const checked = checks.filter(input => input.checked).length;
        selectAll.checked = checks.length > 0 && checked === checks.length;
        selectAll.indeterminate = checked > 0 && checked < checks.length;
        selectAll.disabled = checks.length === 0;
      }
      if (previous) previous.disabled = page === 0;
      if (next) next.disabled = page === pages - 1;
      const count = root.querySelector('[data-table-count]');
      const selected = rows.flatMap(row => [...row.querySelectorAll('[data-table-row-select]:checked')]).length;
      if (count) count.textContent = `${matches.length ? page * size + 1 : 0}–${Math.min((page + 1) * size, matches.length)} of ${matches.length} ${root.dataset.tableLabel || 'records'}${selected ? ` · ${selected} selected` : ''}`;
      const status = root.querySelector('[data-table-page-status]');
      if (status) status.textContent = `${page + 1} / ${pages}`;
      body.append(empty);
      empty.hidden = matches.length > 0;
    };
    search?.addEventListener('input', () => { page = 0; update(); });
    filters.forEach(filter => filter.addEventListener('change', () => { page = 0; update(); }));
    previous?.addEventListener('click', () => { page = Math.max(0, page - 1); update(); });
    next?.addEventListener('click', () => { page++; update(); });
    selectAll?.addEventListener('change', () => {
      [...body.rows].filter(row => !row.hidden).forEach(row => row.querySelectorAll('[data-table-row-select]:not(:disabled)').forEach(input => { input.checked = selectAll.checked; }));
      update();
    });
    body.addEventListener('change', update);
    root.addEventListener('tableupdate', () => { page = 0; update(); });
    update();
  };
  const initChecklist = root => {
    const update = () => {
      const inputs = [...root.querySelectorAll('input[type="checkbox"]')];
      const completed = inputs.filter(input => input.checked).length;
      const percent = inputs.length ? Math.round(completed / inputs.length * 100) : 0;
      const count = root.querySelector('[data-checklist-count]'), percentage = root.querySelector('[data-checklist-percentage]'), progress = root.querySelector('[data-checklist-progress]');
      if (count) count.textContent = `${completed} / ${inputs.length}`;
      if (percentage) percentage.textContent = `${percent}%`;
      if (progress) {
        progress.setAttribute('aria-valuenow', percent);
        const bar = progress.querySelector('.progress-bar');
        if (bar) bar.style.width = `${percent}%`;
      }
    };
    root.addEventListener('change', update);
    update();
  };
  // Session-only dashboard demo data and actions.
  const initDashboardDemo = () => {
    const find = selector => document.querySelector(selector);
    const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
    const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const today = new Date();
    const dayAgo = days => dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days, 12));
    const element = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      return node;
    };
    let balance = 12543000;
    let paymentMode = 'transfer';
    let filtersVisible = false;
    const transactions = [
      { name: 'Samantha William', ago: 0, time: '10:15 AM', type: 'income', amount: 164026, color: '#d53b99', initial: 'S' },
      { name: 'Grocery at Shop', ago: 1, time: '6:45 PM', type: 'expense', amount: 7264, color: '#39ad86', icon: 'fa-basket-shopping' },
      { name: 'Coffee', ago: 3, time: '8:30 AM', type: 'expense', amount: 865, color: '#e9a71b', icon: 'fa-mug-hot' },
      { name: 'Karen Smith', ago: 5, time: '3:50 PM', type: 'income', amount: 84250, color: '#a84cf1', initial: 'K' },
      { name: 'Transportation', ago: 7, time: '5:20 PM', type: 'expense', amount: 1852, color: '#e24d57', icon: 'fa-car-side' },
      { name: 'Online Course Purchase', ago: 10, time: '2:10 PM', type: 'expense', amount: 12000, color: '#4f7ee6', icon: 'fa-book-open' }
    ].map(row => ({ ...row, date: dayAgo(row.ago) }));
    const filteredTransactions = () => {
      const query = find('#transaction-search').value.trim().toLowerCase();
      const type = find('#transaction-type').value;
      return transactions.filter(row => (type === 'all' || row.type === type) && row.name.toLowerCase().includes(query));
    };
    const renderTransactions = () => {
      const matches = filteredTransactions();
      const body = find('#overview-record-body');
      body.replaceChildren();
      matches.forEach(row => {
        const tr = element('tr');
        const name = element('td');
        const label = element('div', 'overview-record-name');
        const avatar = element('span', 'overview-avatar record-avatar', row.initial || '');
        avatar.style.setProperty('--avatar-color', row.color);
        avatar.setAttribute('aria-hidden', 'true');
        if (row.icon) avatar.append(element('i', `fa-light ${row.icon}`));
        label.append(avatar, element('span', '', row.name));
        name.append(label);
        const date = new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        const type = element('td');
        type.append(element('span', 'overview-type-badge', row.type === 'income' ? 'Income' : row.type === 'request' ? 'Requested' : 'Expenses'));
        const sign = row.type === 'income' ? '+' : row.type === 'expense' ? '−' : '';
        tr.append(name, element('td', '', `${date}, ${row.time}`), type, element('td', `numeric-cell ${row.type === 'income' ? 'positive' : row.type === 'expense' ? 'negative' : 'neutral'}`, `${sign}${money(row.amount)}`));
        body.append(tr);
      });
      if (!matches.length) {
        const row = element('tr');
        const cell = element('td', 'empty-state', 'No transactions match your filters.');
        cell.colSpan = 4; row.append(cell); body.append(row);
      }
      find('#transaction-count').textContent = `${matches.length} of ${transactions.length} transactions`;
      find('#view-transactions').textContent = filtersVisible ? 'Hide Filters' : 'Filters';
      find('#view-transactions').setAttribute('aria-expanded', String(filtersVisible));
      find('#transaction-filters').hidden = !filtersVisible;
    };
    find('#view-transactions').addEventListener('click', () => {
      filtersVisible = !filtersVisible;
      if (!filtersVisible) { find('#transaction-search').value = ''; find('#transaction-type').value = 'all'; }
      renderTransactions();
    });
    find('#transaction-search').addEventListener('input', renderTransactions);
    find('#transaction-type').addEventListener('change', renderTransactions);
    find('#find-transactions').addEventListener('click', () => {
      filtersVisible = true; renderTransactions();
      location.hash = 'transactions';
      find('#transaction-search').focus({ preventScroll: true });
    });
    renderTransactions();

    [38, 17, 42, 58, 25, 71, 49, 36, 79, 28, 50, 63, 46, 77, 31, 54, 89, 66, 41, 21, 48, 70, 34, 61, 84, 50, 27, 74, 45, 90, 63, 48, 80, 58, 36, 67, 95, 72, 44, 56, 79, 61].forEach(height => {
      const bar = element('span'); bar.style.height = `${height}%`; find('.overview-mini-bars').append(bar);
    });
    const monthlyValues = [10600, 26100, 15800, 24800, 17100, 18400];
    const monthlyExpenses = monthlyValues.map((amount, index) => [new Date(today.getFullYear(), today.getMonth() - 5 + index, 1).toLocaleDateString('en-US', { month: 'short' }), amount]);
    find('.overview-monthly-bars').setAttribute('aria-label', `Monthly expenses: ${monthlyExpenses.map(([month, value]) => `${month} ${money(value * 100)}`).join('; ')}`);
    [...document.querySelectorAll('.overview-monthly-bars > div')].forEach((column, index) => {
      column.querySelector('small').textContent = monthlyExpenses[index][0];
      column.querySelector('span').title = `${monthlyExpenses[index][0]}: ${money(monthlyExpenses[index][1] * 100)}`;
    });

    const cards = [
      { name: 'Credit Card', digits: '2368', balance: 532557, color: 'green' },
      { name: 'Digital Card', digits: '1847', balance: 1089243, color: 'blue' },
      { name: 'Premium Card', digits: '9876', balance: 215689, color: 'purple' },
      { name: 'Business Card', digits: '5432', balance: 1574321, color: 'slate' }
    ];
    const track = find('#wallet-cards');
    const updateWalletArrows = () => {
      find('#wallet-previous').disabled = track.scrollLeft < 2;
      find('#wallet-next').disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    const renderCard = card => {
      const article = element('article', `overview-preview-card ${card.color}`);
      article.setAttribute('aria-label', `${card.name}, ending ${card.digits}, ${money(card.balance)}`);
      const top = element('div', 'overview-card-top');
      const chip = element('i', 'fa-light fa-wifi'); chip.setAttribute('aria-hidden', 'true');
      top.append(element('span', '', card.name), chip);
      const bottom = element('div', 'overview-card-bottom');
      const logo = element('span', 'overview-card-mark'); logo.setAttribute('aria-hidden', 'true');
      bottom.append(element('strong', '', money(card.balance)), logo);
      article.append(top, element('p', 'overview-card-code', `5375 **** **** ${card.digits}`), bottom);
      track.append(article);
      find('#wallet-count').textContent = `A total of ${cards.length} cards are listed`;
      requestAnimationFrame(updateWalletArrows);
    };
    cards.forEach(renderCard);
    track.addEventListener('scroll', updateWalletArrows, { passive: true });
    window.addEventListener('resize', updateWalletArrows);
    const scrollWallet = direction => track.scrollBy({ left: direction * (track.querySelector('article').offsetWidth + 14), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    find('#wallet-previous').addEventListener('click', () => scrollWallet(-1));
    find('#wallet-next').addEventListener('click', () => scrollWallet(1));
    find('#card-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      const name = values.get('name').trim(), digits = values.get('digits');
      if (!name || !/^[0-9]{4}$/.test(digits) || !form.reportValidity()) return;
      const color = ['green', 'blue', 'purple', 'slate'].includes(values.get('color')) ? values.get('color') : 'green';
      const card = { name, digits, color, balance: 0 };
      cards.push(card); renderCard(card);
      track.scrollLeft = track.scrollWidth;
      AdminUI.hideModal(find('#card-modal'));
      AdminUI.notify('Demo card added to your wallet.');
    });

    document.querySelectorAll('[data-payment]').forEach(button => button.addEventListener('click', () => {
      paymentMode = button.dataset.payment;
      const request = paymentMode === 'request';
      find('#payment-title').textContent = request ? 'Request money' : 'Transfer money';
      find('#payment-description').textContent = request ? 'Create a sample payment request. No request is sent.' : 'Create a sample transfer. No real money is moved.';
      find('#payment-submit').textContent = request ? 'Create sample request' : 'Create sample transfer';
      find('#payment-amount').max = request ? '999999999' : (balance / 100).toFixed(2);
      find('#payment-amount').setCustomValidity('');
      find('#payment-available').textContent = request ? 'Requests are recorded as pending activity.' : `Available demo balance: ${money(balance)}`;
    }));
    find('#payment-amount').addEventListener('input', event => event.target.setCustomValidity(''));
    find('#payment-form').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      const recipient = values.get('recipient').trim();
      const amount = Math.round(Number(values.get('amount')) * 100);
      if (!recipient || !Number.isSafeInteger(amount) || amount < 1 || !form.reportValidity()) return;
      if (paymentMode === 'transfer' && amount > balance) {
        find('#payment-amount').setCustomValidity('Amount exceeds your available demo balance.');
        form.reportValidity(); return;
      }
      if (paymentMode === 'transfer') balance -= amount;
      transactions.unshift({ name: paymentMode === 'request' ? `Request · ${recipient}` : recipient, date: dayAgo(0), time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), type: paymentMode === 'request' ? 'request' : 'expense', amount, color: '#3288d1', icon: paymentMode === 'request' ? 'fa-arrow-down' : 'fa-arrow-up' });
      find('#overview-total').textContent = money(balance).replace(/\.00$/, '');
      find('#transaction-search').value = ''; find('#transaction-type').value = 'all';
      renderTransactions();
      AdminUI.hideModal(find('#payment-modal'));
      AdminUI.notify(paymentMode === 'request' ? 'Sample request created for today. No request was sent.' : 'Sample transfer recorded for today. No real money was moved.');
    });

    const reports = {
      income: { title: 'Income Sources', description: 'Portfolio income snapshot · Sample data', rows: [['Rental', 35000], ['Investments', 28000], ['Business', 18000], ['Freelance', 11000], ['Total income', 92000]] },
      expenses: { title: 'Monthly Expenses', description: 'Expenses over the last six months · Sample data', rows: monthlyExpenses },
      summary: { title: 'Spending Summary', description: 'Everyday spending breakdown · Sample data', rows: [['Food & Drink · 48%', 540], ['Grocery · 32%', 360], ['Shopping · 13%', 146.25], ['Transport · 7%', 78.75], ['Total spending', 1125]] },
      savings: { title: 'Saving Goal', description: 'Your progress toward a $1,200 goal · Sample data', rows: [['Saved so far', 1052.98], ['Goal', 1200], ['Remaining', 147.02]] }
    };
    const overviewReport = () => ({ title: 'Dashboard Overview', description: 'Portfolio snapshot · Sample data', rows: [['Balance', balance / 100], ['Net profit', 38700], ['Expenses', 26450], ['Pending invoices', 3200], ['Total income', 92000]] });
    let selectedReport = 'overview';
    document.querySelectorAll('[data-report]').forEach(button => button.addEventListener('click', () => {
      selectedReport = button.dataset.report;
      const report = reports[selectedReport];
      find('#report-title').textContent = report.title;
      find('#report-description').textContent = report.description;
      find('#report-content').replaceChildren(...report.rows.map(([name, amount]) => {
        const row = element('div', 'overview-report-row');
        row.append(element('span', '', name), element('strong', '', money(Math.round(amount * 100))));
        return row;
      }));
    }));
    const exportReport = key => {
      const report = key === 'overview' ? overviewReport() : reports[key];
      const rows = [['Report', 'Metric', 'Amount (USD)'], ...report.rows.map(([name, amount]) => [report.title, name, amount])];
      if (key === 'overview') {
        rows.push([], ['Transaction period', 'All dates'], ['Transaction', 'Date', 'Type', 'Amount (USD)']);
        filteredTransactions().forEach(row => rows.push([row.name, row.date, row.type, row.type === 'expense' ? -row.amount / 100 : row.amount / 100]));
      }
      // Neutralize spreadsheet formulas in names entered into the demo forms.
      const csv = rows.map(row => row.map(value => `"${(typeof value === 'string' ? value.replace(/^[\s]*[=+@-]/, match => `'${match}`) : String(value)).replaceAll('"', '""')}"`).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
      const link = element('a'); link.href = url; link.download = `evergreen-report-${key}.csv`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      AdminUI.notify('Your dashboard report has been downloaded.');
    };
    find('[data-export]').addEventListener('click', () => exportReport('overview'));
    find('#download-report').addEventListener('click', () => exportReport(selectedReport));
  };
  const init = (root = document) => {
    const each = (selector, setup) => {
      const elements = [...root.querySelectorAll(selector)];
      if (root instanceof Element && root.matches(selector)) elements.unshift(root);
      elements.forEach(element => {
        const behaviors = initialized.get(element) || new Set();
        if (behaviors.has(selector)) return;
        behaviors.add(selector);
        initialized.set(element, behaviors);
        setup(element);
      });
    };
    each('button[data-bs-toggle], button[data-bs-dismiss], button[data-bs-slide]', asButton);
    each('.theme-toggle, [data-theme-toggle]', button => {
      asButton(button);
      button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark';
      setTheme(theme);
      const key = document.documentElement.dataset.themeStorage;
      if (key) try { localStorage.setItem(key, theme); } catch { /* Theme remains usable without storage. */ }
      });
    });
    each('[data-sidebar-layout]', initSidebar);
    each('[data-notify]', button => button.addEventListener('click', () => notify(button.dataset.notify, button.dataset.toastTarget || undefined)));
    if (window.bootstrap) {
      each('[data-bs-toggle="tooltip"]', element => bootstrap.Tooltip.getOrCreateInstance(element));
      each('[data-bs-toggle="popover"]', element => bootstrap.Popover.getOrCreateInstance(element));
      each('.modal, .offcanvas', initOverlay);
    }
    each('[data-indeterminate]', input => { input.indeterminate = true; });
    each('input[type="range"]', input => {
      const update = () => {
        if (!input.id) return;
        document.querySelectorAll('output[for]').forEach(output => {
          if (output.htmlFor.contains(input.id)) output.textContent = `${input.value}${output.dataset.suffix || ''}`;
        });
      };
      input.addEventListener('input', update);
      update();
    });
    each('[data-pagination]', initPagination);
    each('[data-table]', initTable);
    each('[data-checklist]', initChecklist);
    each('[data-segment]', initSegment);
    each('.overview-page', initDashboardDemo);
    each('[data-date-range]', initDateRange);
    const key = document.documentElement.dataset.themeStorage;
    let theme = document.documentElement.dataset.bsTheme;
    if (key) try { theme = localStorage.getItem(key) || theme; } catch { /* Respect the page theme if storage is unavailable. */ }
    if (theme) setTheme(theme);
  };
  window.AdminUI = { init, setTheme, notify, hideModal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();
})();
