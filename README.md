# Admin Dashboard Theme

Open `index.html` for the design template. Home contains the full component showcase, grouped into Foundations, Buttons & badges, Form controls, Navigation, Feedback & states, Overlays, Cards & lists, and Dashboard & data display. The left menu links to these groups and the transaction, task, and table examples with `#` IDs.

The Bootstrap showcase includes typography, color swatches, icons, avatars, button variants and sizes, badges, native form inputs and validation states, tabs, accordion, breadcrumbs, dropdowns, pagination, alerts, loading skeletons, empty states, dialogs, side panels, toasts, tooltips, popovers, lists, card layouts, carousel, collapsible content, and progress bars. Dashboard patterns include sample analytics, line/donut/bar charts, searchable and paginated transactions, CSV exports, and task management. Shared CSS theme tokens style neutral buttons, inputs, cards, tabs, badges, menus, and dialogs in light and dark mode. Transactions and tasks live for the current page session; theme and workspace preferences use browser storage.

Serve locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/index.html`. Bootstrap and Font Awesome load from the existing CDN links, so an internet connection is required.

With Playwright available, run `node checks/home.cjs` against the local server for the browser smoke check. Set `CHROME_PATH` to use an installed Chrome executable, or `DASHBOARD_URL` to check another local server.
