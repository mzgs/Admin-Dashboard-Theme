'use strict';

// Sample business data and showcase actions. Do not copy this file to other sites.
(() => {
  const find = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const number = value => new Intl.NumberFormat('en-US').format(value);
  const notify = message => AdminUI.notify(message);
  const hideModal = modal => AdminUI.hideModal(modal);
  const periods = {
    month: { label: 'September 2026', cadence: 'Daily', revenue: 48290, customers: 2420, orders: 1864, conversion: '3.62%', revenueTrend: '12.8%', customerTrend: '8.2%', orderTrend: '6.4%', conversionTrend: '0.4 pp', labels: ['Sep 1', 'Sep 6', 'Sep 11', 'Sep 16', 'Sep 21', 'Sep 26', 'Sep 30'], points: [26, 36, 32, 47, 40, 55, 51, 64, 48, 62, 56, 73, 67, 82, 75, 90, 84, 96], previous: [22, 28, 25, 38, 34, 42, 39, 47, 43, 50, 45, 57, 51, 59, 54, 68, 60, 71] },
    week: { label: 'Sep 28 – Oct 4, 2026', cadence: 'Daily', revenue: 12480, customers: 684, orders: 492, conversion: '3.84%', revenueTrend: '9.4%', customerTrend: '5.6%', orderTrend: '7.1%', conversionTrend: '0.2 pp', labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], points: [36, 49, 40, 63, 58, 78, 86], previous: [28, 38, 33, 49, 43, 63, 71] },

  };
  periods.day = { ...periods.week, cadence: 'Hourly', revenue: Math.round(periods.week.revenue / 7), customers: Math.round(periods.week.customers / 7), orders: Math.round(periods.week.orders / 7), labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] };
  let reportPeriod = 'day';
  let presetPeriod = reportPeriod;
  let chartMetric = 'revenue';
  const drawChart = () => {
    const data = periods[reportPeriod];
    const orders = chartMetric === 'orders';
    const maximum = orders ? (data.orders > 10000 ? 2500 : data.orders > 1000 ? 150 : 100) : (data.revenue > 100000 ? 60000 : 4000);
    const coords = points => points.map((point, index) => `${48 + index * 574 / (points.length - 1)},${192 - point * 1.65}`);
    const current = coords(data.points);
    find('#chart-current').setAttribute('d', `M${current.join(' L')}`);
    find('#chart-area').setAttribute('d', `M48,192 L${current.join(' L')} L622,192 Z`);
    find('#chart-previous').setAttribute('d', `M${coords(data.previous).join(' L')}`);
    find('#chart-grid').innerHTML = Array.from({ length: 5 }, (_, index) => {
      const y = 27 + index * 41.25;
      const value = maximum * (4 - index) / 4;
      const label = orders ? number(Math.round(value)) : value ? `$${value / 1000}k` : '$0';
      return `<line class="chart-grid" x1="48" x2="622" y1="${y}" y2="${y}"/><text class="chart-axis" x="0" y="${y + 4}">${label}</text>`;
    }).join('');
    find('#chart-labels').innerHTML = data.labels.map((label, index) => `<text class="chart-axis" x="${48 + index * 574 / (data.labels.length - 1)}" y="222" text-anchor="${index === 0 ? 'start' : index === data.labels.length - 1 ? 'end' : 'middle'}">${label}</text>`).join('');
    find('#chart-total').textContent = orders ? number(data.orders) : money(data.revenue);
    find('#chart-trend').textContent = `↗ ${orders ? data.orderTrend : data.revenueTrend}`;
    find('#revenue-subtitle').textContent = `${data.cadence} ${chartMetric} · ${data.label}`;
    find('#chart-title').textContent = `${orders ? 'Orders' : 'Revenue'} comparison · ${data.label}`;
    find('#chart-description').textContent = `Sample ${chartMetric} for ${data.label}, trending ${orders ? data.orderTrend : data.revenueTrend} above the previous period.`;
    all('[data-chart-metric]').forEach(button => button.setAttribute('aria-pressed', button.dataset.chartMetric === chartMetric));
  };
  const updateMetrics = () => {
    const data = periods[reportPeriod];
    find('#metric-revenue').textContent = money(data.revenue);
    find('#metric-customers').textContent = number(data.customers);
    find('#metric-orders').textContent = number(data.orders);
    find('#metric-conversion').textContent = data.conversion;
    find('#channel-total').textContent = number(data.customers);
    ['revenue', 'customers', 'orders'].forEach((key, index) => {
      find(`#trend-${key}`).textContent = `↗ ${data[['revenueTrend', 'customerTrend', 'orderTrend'][index]]}`;
    });
    find('#trend-conversion').textContent = `↘ ${data.conversionTrend}`;
    all('[data-sparkline]').forEach((svg, index) => {
      const values = (index === 3 ? [...data.previous].reverse() : data.points).filter((_, point) => point % 2 === 0);
      const points = values.map((value, point) => `${point * 80 / (values.length - 1)},${29 - value * .26}`).join(' ');
      svg.innerHTML = `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    drawChart();
  };
  find('#data-examples [data-date-range]').addEventListener('datechange', ({ detail }) => {
    if (!detail.start) reportPeriod = presetPeriod;
    else {
      const start = new Date(`${detail.start}T12:00:00`), end = new Date(`${detail.end}T12:00:00`);
      const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000) + 1;
      reportPeriod = detail.preset || 'custom';
      if (detail.preset) presetPeriod = detail.preset;
      // ponytail: scale demo totals; replace with daily records when a data source is connected.
      if (!detail.preset) periods.custom = { ...periods.month, revenue: Math.round(periods.month.revenue * days / 30), customers: Math.round(periods.month.customers * days / 30), orders: Math.round(periods.month.orders * days / 30) };
      periods[reportPeriod].label = detail.label;
      if (reportPeriod !== 'day') periods[reportPeriod].labels = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + Math.round(index * (days - 1) / 6), 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    updateMetrics();
  });

  find('[data-segment]').addEventListener('segmentchange', ({ detail }) => { chartMetric = detail.value; drawChart(); });
  updateMetrics();

  const transactions = [
    { id: 'INV-2026-1048', customer: 'Olivia Rhye', email: 'olivia@acme.com', amount: 1250, status: 'Paid', date: '2026-10-04', color: 'purple' },
    { id: 'INV-2026-1047', customer: 'Phoenix Baker', email: 'phoenix@layers.com', amount: 840, status: 'Paid', date: '2026-10-04', color: 'blue' },
    { id: 'INV-2026-1046', customer: 'Lana Steiner', email: 'lana@sisyphus.com', amount: 2100, status: 'Pending', date: '2026-10-03', color: 'green' },
    { id: 'INV-2026-1045', customer: 'Demi Wilkinson', email: 'demi@catalog.com', amount: 650, status: 'Paid', date: '2026-10-03', color: 'coral' },
    { id: 'INV-2026-1044', customer: 'Drew Cano', email: 'drew@circooles.com', amount: 420, status: 'Failed', date: '2026-10-02', color: 'amber' },
    { id: 'INV-2026-1043', customer: 'Natali Craig', email: 'natali@hourglass.com', amount: 1890, status: 'Paid', date: '2026-10-02', color: 'cyan' },
    { id: 'INV-2026-1042', customer: 'Orlando Diggs', email: 'orlando@command.com', amount: 720, status: 'Pending', date: '2026-10-01', color: 'purple' },
    { id: 'INV-2026-1041', customer: 'Andi Lane', email: 'andi@quotient.com', amount: 3100, status: 'Paid', date: '2026-10-01', color: 'blue' },
    { id: 'INV-2026-1040', customer: 'Kate Morrison', email: 'kate@focal.com', amount: 960, status: 'Paid', date: '2026-09-30', color: 'green' },
    { id: 'INV-2026-1039', customer: 'James Davis', email: 'james@global.co', amount: 560, status: 'Pending', date: '2026-09-30', color: 'amber' },
    { id: 'INV-2026-1038', customer: 'Ava Kim', email: 'ava@pioneer.co', amount: 1480, status: 'Paid', date: '2026-09-29', color: 'coral' },
    { id: 'INV-2026-1037', customer: 'Mia Smith', email: 'mia@apex.co', amount: 340, status: 'Failed', date: '2026-09-29', color: 'cyan' }
  ];
  let nextInvoice = 1049;
  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const table = find('[data-table]');
  const filteredTransactions = () => {
    const ids = new Set(all('[data-table] tbody tr[data-table-match="true"]').map(row => row.dataset.id));
    return transactions.filter(row => ids.has(row.id));
  };
  const renderTransactions = () => {
    const selected = new Set(all('[data-table-row-select]:checked').map(input => input.value));
    find('#transaction-rows').innerHTML = transactions.map(row => {
      const initials = row.customer.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('');
      const date = new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `<tr data-id="${escapeHTML(row.id)}" data-status="${escapeHTML(row.status)}"><td><input type="checkbox" class="form-check-input transaction-check" data-table-row-select value="${escapeHTML(row.id)}" aria-label="Select ${escapeHTML(row.id)}" ${selected.has(row.id) ? 'checked' : ''}></td><td><div class="label-cell"><span class="initial-avatar ${row.color}" aria-hidden="true">${escapeHTML(initials)}</span><span><span class="customer-name">${escapeHTML(row.customer)}</span><span class="customer-email">${escapeHTML(row.email)}</span></span></div></td><td class="text-body-secondary">${escapeHTML(row.id)}</td><td><span class="status-badge ${row.status === 'Paid' ? '' : row.status.toLowerCase()}">${escapeHTML(row.status)}</span></td><td class="table-amount">${money(row.amount)}</td><td class="text-body-secondary">${date}</td></tr>`;
    }).join('');
    table.dispatchEvent(new Event('tableupdate'));
  };
  renderTransactions();

  const downloadCSV = (filename, rows) => {
    // Prefix formula-like text so user-entered names remain text in spreadsheet apps.
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/^([\s]*[=+@-])/, "'$1").replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Your CSV report has been downloaded.');
  };
  const exportReport = () => {
    const data = periods[reportPeriod];
    downloadCSV(`evergreen-${reportPeriod}-report.csv`, [['Period', 'Metric', 'Value'], [data.label, 'Total revenue (USD)', data.revenue], [data.label, 'Active customers', data.customers], [data.label, 'Total orders', data.orders], [data.label, 'Conversion rate', data.conversion]]);
  };
  find('#export-report').addEventListener('click', exportReport);
  find('#quick-export').addEventListener('click', exportReport);
  find('#export-transactions').addEventListener('click', () => downloadCSV('evergreen-transactions.csv', [['Invoice', 'Customer', 'Email', 'Amount (USD)', 'Status', 'Date'], ...filteredTransactions().map(row => [row.id, row.customer, row.email, row.amount, row.status, row.date])]));
  find('#transaction-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const customer = values.get('customer').trim();
    const amount = Number(values.get('amount'));
    if (!customer || !Number.isFinite(amount) || amount <= 0 || !form.reportValidity()) return;
    transactions.unshift({ id: `INV-2026-${nextInvoice++}`, customer, email: values.get('email').trim(), amount, status: values.get('status'), date: values.get('date'), color: 'purple' });
    find('#transaction-search').value = ''; find('#transaction-status').value = 'all';
    renderTransactions();
    hideModal(find('#transaction-modal'));
    form.reset(); notify('Transaction added to your sample payments.');
  });

  const updateTasks = () => find('[data-checklist]').dispatchEvent(new Event('change', { bubbles: true }));
  find('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    const title = find('#new-task').value.trim();
    if (!title || !event.currentTarget.reportValidity()) return;
    const label = document.createElement('label');
    label.className = 'task-row';
    label.innerHTML = `<input type="checkbox" class="form-check-input"><span class="task-copy"><span>${escapeHTML(title)}</span><small>Workspace · New task</small></span><span class="initial-avatar purple">LC</span>`;
    find('#task-list').append(label); updateTasks();
    hideModal(find('#task-modal'));
    event.currentTarget.reset(); notify('Task added to your list.');
  });
  find('#reset-tasks').addEventListener('click', () => {
    all('#task-list input').forEach(input => { input.checked = false; }); updateTasks();
    hideModal(find('#reset-modal')); notify('All tasks are marked incomplete.');
  });

  const applyWorkspaceName = name => {
    find('.workspace-switcher > span:nth-child(2)').textContent = name;
  };
  try {
    const preferences = JSON.parse(localStorage.getItem('evergreen-preferences'));
    if (preferences && typeof preferences.workspace === 'string' && preferences.workspace.trim()) {
      find('#workspace-name').value = preferences.workspace;
      find('#digest-frequency').value = preferences.digest;
      find('#review-date').value = preferences.date;
      find('#email-notifications').checked = preferences.email === true;
      find('#weekly-report').checked = preferences.report === true;
      applyWorkspaceName(preferences.workspace);
    }
  } catch { /* Default preferences remain usable when browser storage is unavailable. */ }
  find('#preferences-form').addEventListener('submit', event => {
    event.preventDefault();
    const workspace = find('#workspace-name').value.trim();
    if (!workspace || !event.currentTarget.reportValidity()) return;
    applyWorkspaceName(workspace);
    const preferences = { workspace, digest: find('#digest-frequency').value, date: find('#review-date').value, email: find('#email-notifications').checked, report: find('#weekly-report').checked };
    let message = 'Workspace preferences saved on this browser.';
    try { localStorage.setItem('evergreen-preferences', JSON.stringify(preferences)); } catch { message = 'Preferences applied for this session. Browser storage is unavailable.'; }
    find('#preferences-status').textContent = message;
    notify(message);
  });
})();
