# Admin Dashboard Theme

Open `home.html` for the dashboard or `index.html` for the customers page. Both pages share the sidebar and dark/light theme.

The home dashboard includes sample analytics, line/donut/bar charts, searchable and paginated transactions, CSV exports, task management, and a Bootstrap component showcase. Transactions and tasks live for the current page session; theme and workspace preferences use browser storage.

Serve locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/home.html`. Bootstrap and Font Awesome load from the existing CDN links, so an internet connection is required.

With Playwright available, run `node checks/home.cjs` against the local server for the browser smoke check. Set `CHROME_PATH` to use an installed Chrome executable, or `DASHBOARD_URL` to check another local server.
