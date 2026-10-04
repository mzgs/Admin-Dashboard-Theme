'use strict';

const $ = selector => document.querySelector(selector);
const setTheme = theme => {
  document.documentElement.dataset.bsTheme = theme;
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  $('.theme-toggle').setAttribute('aria-label', label);
  $('.theme-toggle').title = label;
  $('.theme-toggle i').className = `fa-light fa-${theme === 'dark' ? 'sun' : 'moon'}`;
};
try { setTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark'); } catch { setTheme('dark'); }
$('.theme-toggle').addEventListener('click', () => {
  setTheme(document.documentElement.dataset.bsTheme === 'dark' ? 'light' : 'dark');
  try { localStorage.setItem('theme', document.documentElement.dataset.bsTheme); } catch { /* Switching still works when storage is unavailable. */ }
});
const closeMobileSidebar = () => { document.body.classList.remove('sidebar-mobile-open'); $('.mobile-menu').setAttribute('aria-expanded', 'false'); };
$('.sidebar-toggle').addEventListener('click', event => {
  if (matchMedia('(max-width: 767px)').matches) { closeMobileSidebar(); return; }
  const on = document.body.classList.toggle('sidebar-expanded');
  event.currentTarget.setAttribute('aria-expanded', on); event.currentTarget.setAttribute('aria-label', on ? 'Collapse navigation' : 'Expand navigation'); event.currentTarget.title = on ? 'Collapse navigation' : 'Expand navigation';
  if (!on) document.querySelectorAll('.sidebar-nav .collapse').forEach(section => bootstrap.Collapse.getOrCreateInstance(section, { toggle: false }).show());
});
$('.mobile-menu').addEventListener('click', event => { document.body.classList.add('sidebar-expanded'); const on = document.body.classList.toggle('sidebar-mobile-open'); event.currentTarget.setAttribute('aria-expanded', on); $('.sidebar-toggle').setAttribute('aria-expanded', 'true'); $('.sidebar-toggle').setAttribute('aria-label', 'Collapse navigation'); });
$('#main').addEventListener('click', event => { if (!event.target.closest('.mobile-menu')) closeMobileSidebar(); });
$('.sidebar-nav').addEventListener('click', event => { if (event.target.closest('.rail-button')) closeMobileSidebar(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMobileSidebar(); });

const updateActiveSection = () => {
  const target = location.hash || '#home';
  document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(link => {
    const active = link.getAttribute('href') === target;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};
window.addEventListener('hashchange', updateActiveSection);
updateActiveSection();
