# Admin Dashboard Theme

Open `index.html` for the dashboard. Home, Table, and sidebar destinations are sections in this one page, linked with `#` IDs (for example, `#home` and `#generic-table`).

The home dashboard includes sample analytics, line/donut/bar charts, searchable and paginated transactions, CSV exports, task management, and a shadcn-inspired component showcase built with Bootstrap. Shared CSS theme tokens style neutral buttons, inputs, cards, tabs, badges, menus, and dialogs in light and dark mode. Transactions and tasks live for the current page session; theme and workspace preferences use browser storage.

Serve locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/index.html`. Bootstrap and Font Awesome load from the existing CDN links, so an internet connection is required.

With Playwright available, run `node checks/home.cjs` against the local server for the browser smoke check. Set `CHROME_PATH` to use an installed Chrome executable, or `DASHBOARD_URL` to check another local server.
