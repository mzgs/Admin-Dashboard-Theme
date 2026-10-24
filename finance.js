'use strict';

// Session-only sample data. Shared navigation, themes, date picker, and dialogs use AdminUI.
(() => {
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
  let expanded = false;
  let start = dayAgo(27), end = dayAgo(0);
  const dateRange = find('[data-date-range]');
  dateRange.querySelector('[data-date-start]').value = start;
  dateRange.querySelector('[data-date-end]').value = end;
  const transactions = [
    { name: 'Samantha William', ago: 0, time: '10:15 AM', type: 'income', amount: 164026, color: '#d53b99', initial: 'S' },
    { name: 'Grocery at Shop', ago: 1, time: '6:45 PM', type: 'expense', amount: 7264, color: '#39ad86', icon: 'fa-basket-shopping' },
    { name: 'Coffee', ago: 3, time: '8:30 AM', type: 'expense', amount: 865, color: '#e9a71b', icon: 'fa-mug-hot' },
    { name: 'Karen Smith', ago: 5, time: '3:50 PM', type: 'income', amount: 84250, color: '#a84cf1', initial: 'K' },
    { name: 'Transportation', ago: 7, time: '5:20 PM', type: 'expense', amount: 1852, color: '#e24d57', icon: 'fa-car-side' },
    { name: 'Online Course Purchase', ago: 10, time: '2:10 PM', type: 'expense', amount: 12000, color: '#4f7ee6', icon: 'fa-book-open' },
    { name: 'Freelance Project Payment', ago: 12, time: '11:00 AM', type: 'income', amount: 98075, color: '#439b55', initial: 'F' },
    { name: 'Monthly subscription', ago: 14, time: '9:00 AM', type: 'expense', amount: 2400, color: '#76738b', icon: 'fa-repeat' },
    { name: 'Alex Johnson', ago: 16, time: '12:30 PM', type: 'income', amount: 45000, color: '#3aabb7', initial: 'A' },
    { name: 'Restaurant', ago: 20, time: '7:40 PM', type: 'expense', amount: 6850, color: '#d78a53', icon: 'fa-utensils' },
    { name: 'Design project', ago: 35, time: '11:15 AM', type: 'income', amount: 125000, color: '#835bc1', initial: 'D' },
    { name: 'Home supplies', ago: 48, time: '4:00 PM', type: 'expense', amount: 9240, color: '#3b9c83', icon: 'fa-house' }
  ].map(row => ({ ...row, date: dayAgo(row.ago) }));
  const filteredTransactions = () => {
    const query = find('#transaction-search').value.trim().toLowerCase();
    const type = find('#transaction-type').value;
    return transactions.filter(row => (!start || row.date >= start) && (!end || row.date <= end) && (type === 'all' || row.type === type) && row.name.toLowerCase().includes(query));
  };
  const renderTransactions = () => {
    const matches = filteredTransactions();
    const visible = expanded ? matches : matches.slice(0, 7);
    const body = find('#finance-transaction-body');
    body.replaceChildren();
    visible.forEach(row => {
      const tr = element('tr');
      const name = element('td');
      const label = element('div', 'finance-transaction-name');
      const avatar = element('span', 'finance-avatar transaction-avatar', row.initial || '');
      avatar.style.setProperty('--avatar-color', row.color);
      avatar.setAttribute('aria-hidden', 'true');
      if (row.icon) avatar.append(element('i', `fa-light ${row.icon}`));
      label.append(avatar, element('span', '', row.name));
      name.append(label);
      const date = new Date(`${row.date}T12:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const type = element('td');
      type.append(element('span', 'finance-type-badge', row.type === 'income' ? 'Income' : row.type === 'request' ? 'Requested' : 'Expenses'));
      const sign = row.type === 'income' ? '+' : row.type === 'expense' ? '−' : '';
      tr.append(name, element('td', '', `${date}, ${row.time}`), type, element('td', row.type, `${sign}${money(row.amount)}`));
      body.append(tr);
    });
    if (!visible.length) {
      const row = element('tr');
      const cell = element('td', 'empty-state', 'No transactions match your dates or filters.');
      cell.colSpan = 4; row.append(cell); body.append(row);
    }
    find('#transaction-count').textContent = `${visible.length} of ${matches.length} transactions`;
    find('#view-transactions').textContent = expanded ? 'Show Less' : 'View All';
    find('#view-transactions').setAttribute('aria-expanded', String(expanded));
    find('#transaction-filters').hidden = !expanded;
  };
  find('#view-transactions').addEventListener('click', () => {
    expanded = !expanded;
    if (!expanded) { find('#transaction-search').value = ''; find('#transaction-type').value = 'all'; }
    renderTransactions();
  });
  find('#transaction-search').addEventListener('input', renderTransactions);
  find('#transaction-type').addEventListener('change', renderTransactions);
  find('#find-transactions').addEventListener('click', () => {
    expanded = true; renderTransactions();
    location.hash = 'transactions';
    find('#transaction-search').focus({ preventScroll: true });
  });
  dateRange.addEventListener('datechange', ({ detail }) => {
    start = detail.start; end = detail.end; renderTransactions();
  });
  renderTransactions();

  [38, 17, 42, 58, 25, 71, 49, 36, 79, 28, 50, 63, 46, 77, 31, 54, 89, 66, 41, 21, 48, 70, 34, 61, 84, 50, 27, 74, 45, 90, 63, 48, 80, 58, 36, 67, 95, 72, 44, 56, 79, 61].forEach(height => {
    const bar = element('span'); bar.style.height = `${height}%`; find('.finance-invoice-bars').append(bar);
  });
  const monthlyValues = [10600, 26100, 15800, 24800, 17100, 18400];
  const monthlyExpenses = monthlyValues.map((amount, index) => [new Date(today.getFullYear(), today.getMonth() - 5 + index, 1).toLocaleDateString('en-US', { month: 'short' }), amount]);
  find('.finance-monthly-bars').setAttribute('aria-label', `Monthly expenses: ${monthlyExpenses.map(([month, value]) => `${month} ${money(value * 100)}`).join('; ')}`);
  [...document.querySelectorAll('.finance-monthly-bars > div')].forEach((column, index) => {
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
    const article = element('article', `finance-credit-card ${card.color}`);
    article.setAttribute('aria-label', `${card.name}, ending ${card.digits}, ${money(card.balance)}`);
    const top = element('div', 'finance-card-top');
    const chip = element('i', 'fa-light fa-wifi'); chip.setAttribute('aria-hidden', 'true');
    top.append(element('span', '', card.name), chip);
    const bottom = element('div', 'finance-card-bottom');
    const logo = element('span', 'finance-mastercard'); logo.setAttribute('aria-hidden', 'true');
    bottom.append(element('strong', '', money(card.balance)), logo);
    article.append(top, element('p', 'finance-card-number', `5375 **** **** ${card.digits}`), bottom);
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
    find('#finance-balance').textContent = money(balance).replace(/\.00$/, '');
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
  const overviewReport = () => ({ title: 'Finance Overview', description: 'Portfolio snapshot · Sample data', rows: [['Balance', balance / 100], ['Net profit', 38700], ['Expenses', 26450], ['Pending invoices', 3200], ['Total income', 92000]] });
  let selectedReport = 'overview';
  document.querySelectorAll('[data-report]').forEach(button => button.addEventListener('click', () => {
    selectedReport = button.dataset.report;
    const report = reports[selectedReport];
    find('#report-title').textContent = report.title;
    find('#report-description').textContent = report.description;
    find('#report-content').replaceChildren(...report.rows.map(([name, amount]) => {
      const row = element('div', 'finance-report-row');
      row.append(element('span', '', name), element('strong', '', money(Math.round(amount * 100))));
      return row;
    }));
  }));
  const exportReport = key => {
    const report = key === 'overview' ? overviewReport() : reports[key];
    const rows = [['Report', 'Metric', 'Amount (USD)'], ...report.rows.map(([name, amount]) => [report.title, name, amount])];
    if (key === 'overview') {
      rows.push([], ['Transaction period', start || 'All dates', end || 'All dates'], ['Transaction', 'Date', 'Type', 'Amount (USD)']);
      filteredTransactions().forEach(row => rows.push([row.name, row.date, row.type, row.type === 'expense' ? -row.amount / 100 : row.amount / 100]));
    }
    // Neutralize spreadsheet formulas in names entered into the demo forms.
    const csv = rows.map(row => row.map(value => `"${(typeof value === 'string' ? value.replace(/^[\s]*[=+@-]/, match => `'${match}`) : String(value)).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
    const link = element('a'); link.href = url; link.download = `evergreen-finance-${key}.csv`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    AdminUI.notify('Your finance report has been downloaded.');
  };
  find('[data-export]').addEventListener('click', () => exportReport('overview'));
  find('#download-report').addEventListener('click', () => exportReport(selectedReport));
})();
