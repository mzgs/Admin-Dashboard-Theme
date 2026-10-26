'use strict';

// Dashboard component examples. Other sites only need script.js.
(() => {
  const find = selector => document.querySelector(selector);
  const notify = message => AdminUI.notify(message);
  const hideModal = modal => AdminUI.hideModal(modal);
  find('#quick-export').addEventListener('click', () => find('[data-export="overview"]').click());
  find('#transaction-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!find('#new-customer').value.trim() || !form.reportValidity()) return;
    hideModal(find('#transaction-modal'));
    form.reset(); notify('Sample transaction submitted.');
  });
  find('#task-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!find('#new-task').value.trim() || !event.currentTarget.reportValidity()) return;
    hideModal(find('#task-modal'));
    event.currentTarget.reset(); notify('Sample task submitted.');
  });
  find('#reset-tasks').addEventListener('click', () => {
    hideModal(find('#reset-modal')); notify('Reset confirmed.');
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
