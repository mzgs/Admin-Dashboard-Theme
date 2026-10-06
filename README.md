# Admin Dashboard Theme

Open `index.html` for the design template. Home contains the full component showcase, grouped into Foundations, Buttons & badges, Form controls, Navigation, Feedback & states, Overlays, Cards & lists, and Dashboard & data display. The left menu links to these groups and the transaction, task, and table examples with `#` IDs.

The Bootstrap showcase includes typography, color swatches, icons, avatars, button variants and sizes, badges, native form inputs and validation states, tabs, accordion, breadcrumbs, dropdowns, pagination, alerts, loading skeletons, empty states, dialogs, side panels, toasts, tooltips, popovers, lists, card layouts, carousel, collapsible content, and progress bars. Dashboard patterns include sample analytics, a date range selector with Last 24 hours / Last 7 days / Last 30 days presets and an immediate-selection calendar popover, line/donut/bar charts, searchable and paginated transactions, CSV exports, and task management. Shared CSS theme tokens style neutral buttons, inputs, cards, tabs, badges, menus, and dialogs in light and dark mode. Transactions and tasks live for the current page session; theme and workspace preferences use browser storage.

Reuse on another site by copying **`style.css` and `script.js`**, then expanding **View code** beneath an example in [`standalone.html`](standalone.html) to copy its component HTML. Code blocks come directly from the preview markup before initialization, including matching companion dialogs and toasts. Each disclosure includes dependencies and usage notes, with JavaScript event examples where needed; **View setup code** shows the page includes. The standalone gallery has no sidebar, workspace, demo script, or original showcase IDs. It uses ordinary document scrolling and contains two independent date pickers.

Load Bootstrap before the theme and component script:

```html
<html lang="en" data-bs-theme="light">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Your chosen component HTML goes here. -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

Font Awesome is optional: load the showcase's icon stylesheet if you copy `fa-*` icons, or replace them with your own icons/text. Native controls and the date picker work without Bootstrap JavaScript; Bootstrap's tabs, menus, collapse, carousel, alerts, overlays, tooltips, popovers, and toasts require its bundle. The date picker uses the browser's native Popover API.

`script.js` initializes present components automatically at DOM ready, safely ignores absent components, and can be loaded with `defer` or at the end of the body. For dynamically inserted markup, call `AdminUI.init(container)` after insertion. Repeated calls do not duplicate handlers. Use unique IDs for HTML label, Bootstrap target, radio-group, and ARIA relationships when copying multiple examples; date picker popup IDs are generated automatically.

| Component | Copy / enable |
| --- | --- |
| Typography, colors, surfaces, icons, avatars, badges | Matching CSS classes; no JavaScript |
| Buttons, links, button groups | `.btn` variants; native links, submit buttons, and `.btn-check` radio groups keep their browser behavior |
| Text, email, password, number, date, time, file, color, URL, textarea, select, multiple select, floating labels, input groups, suggestions | Standard HTML and `.form-control`, `.form-select`, `.form-label`, `.input-group`, `.form-floating`; preserve labels and validation attributes |
| Checkboxes, radios, switches | `.form-check-input`, `.form-check`, `.form-switch`; add `data-indeterminate` for an initially mixed checkbox |
| Range with value output | `<input type="range" id="volume">` and `<output for="volume" data-suffix="%"></output>`; updates automatically |
| Tabs, accordion, dropdowns, carousel, collapsible content, dismissible alerts | Bootstrap `data-bs-*` markup and unique target IDs |
| Native disclosure, breadcrumbs, static lists, cards, skeletons, empty states, progress | Matching markup/classes; native/CSS behavior |
| Tooltips and popovers | Bootstrap `data-bs-toggle="tooltip"` / `"popover"`; shared script initializes them |
| Modal dialogs and side panels | Bootstrap markup; shared script supplies initial focus, keyboard wrapping, safe early dismissal, background inertness, and focus restoration; opt into form reset with `data-reset-on-close` |
| Toasts | Add `data-ui-toast` to a `.toast`; `AdminUI.notify('Saved')` fills its `.toast-body` and shows it. A `data-notify="Saved"` button does the same; `data-toast-target="my-toast"` selects another instance |
| Pagination | Wrap numbered `data-page="1"` etc. and `data-page="previous"` / `"next"` buttons in `data-pagination`; optional local `data-page-output`; listen for `pagechange` (`{ page, total }`) |
| Segmented controls | `data-segment` group with `data-value` buttons and `aria-pressed`; listen for `segmentchange` (`{ value }`); supports arrow keys and Home/End |
| Date range | `data-date-range` wrapper, `.date-range-trigger` button, optional presets/hidden form inputs; see below |
| Tables | Add `.ui-table` to opt into themed table styles; use `.dashboard-table-wrap` for horizontal scrolling |
| Searchable/paginated/selectable tables | Wrap in `data-table`; optional `data-table-page-size="6"`, search, filters, selection, count, and page controls as in `standalone.html`; all state stays inside that wrapper |
| Checklists | Wrap checkbox rows in `data-checklist`; optional `data-checklist-count`, `data-checklist-percentage`, and `data-checklist-progress` with a `.progress-bar`; updates on `change` |
| Metrics, charts, activity feeds, product lists, goals | Copy the card/SVG/chart markup and classes; supply your own data and actions |
| Sidebar/application shell | Opt into `data-sidebar-layout` on the shell, use the existing sidebar/workspace classes; add `.dashboard-page` only for the fixed-height dashboard with internal scrolling |
| Theme toggle | `.theme-toggle` or `data-theme-toggle`; use `AdminUI.setTheme('light')` / `('dark')`. Storage is opt-in via `<html data-theme-storage="your-site-theme">` |

A minimal picker fits inside any form and requires no fixed IDs:

```html
<div class="date-range-control" data-date-range>
  <button type="button" class="btn btn-secondary date-range-trigger">
    ▦ <span data-date-label>Choose dates</span>
  </button>
  <input type="hidden" name="start_date" data-date-start>
  <input type="hidden" name="end_date" data-date-end>
  <span class="visually-hidden" data-date-status role="status"></span>
</div>
```

The popup is generated inside each wrapper. The optional `data-date-label` displays the selected range and returns to its original text when cleared. Preset button groups are optional; omit `data-date-preset` for an initially empty picker, or prefill the hidden inputs with valid `YYYY-MM-DD` dates. Each selection writes the hidden inputs and emits a bubbling event:

```js
document.querySelector('[data-date-range]').addEventListener('datechange', event => {
  const { start, end, preset, label } = event.detail;
  // Fetch/render your site's data. Dates are inclusive YYYY-MM-DD strings.
  // A cleared custom range has null dates; preset is day/week/month or null.
});
```

Listen before calling `AdminUI.init(container)` when adding markup dynamically if you need the initial event. With deferred scripts, register your listener in a script after `script.js` and before DOM ready. Native form submission includes the selected dates through their input names. Date-only presets cover today, the last seven calendar days, or the last thirty calendar days; calculate rolling timestamps in your data layer if required.

For tables, `data-table-search` searches row text; a select with `data-table-filter="status"` matches a row's `data-status`. Use `data-table-row-select` checkboxes and a `data-table-select-all` checkbox to select visible rows. `data-table-page="previous"` / `"next"`, `data-table-count`, and `data-table-page-status` are optional. Replace/append row markup, then dispatch `new Event('tableupdate')` on the wrapper to refresh and reset pagination. Matching rows have `data-table-match="true"` even when hidden on another page. For a dynamically changed checklist, dispatch `new Event('change', { bubbles: true })` on its wrapper.

The theme applies its palette/type defaults site-wide. Table styling is explicitly opt-in, and fixed dashboard scrolling is opt-in. Static components need only CSS; interactive components use their native, Bootstrap, or shared behavior. Your forms' submission, backend requests, chart data, CSV/report exports, and business actions belong to your application. **`demo.js` contains only the showcase's sample transactions, analytics, exports, task creation, and workspace preferences; other sites do not need it.**

Run `node checks/standalone.cjs` for isolated component, repeated initialization, multi-instance, normal-scrolling, and form/event checks. The existing home, overlay, and date range checks still exercise the original showcase.

Serve locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/index.html`. Bootstrap and Font Awesome load from the existing CDN links, so an internet connection is required.

Use `--background` for the page canvas, `--surface` for cards, tables, menus, and overlays, and `--surface-raised` for muted or hover states. Apply `bg-surface` or `bg-surface-raised` to any element; both follow the active light or dark theme. Controls use `--input` and `--input-bg`; charts use `--chart-1` through `--chart-5`. The Foundations palette previews the background colors.

With Playwright available, run `node checks/home.cjs` against the local server for the browser smoke check. Set `CHROME_PATH` to use an installed Chrome executable, or `DASHBOARD_URL` to check another local server.

The entire showcase follows [shadcn/ui Nova component styles](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/styles/style-nova.css) with the [Zinc palette](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/themes.ts), implemented through the existing Bootstrap components and native controls. Buttons, inputs, tabs, and pagination share a 32 px default height and 8 px corners; cards and dialogs use 12 px corners and 16 px content spacing. Shared styles cover typography, avatars, badges, selections, accordion, menus, alerts, skeletons, empty states, progress, lists, carousel, tooltips, popovers, toasts, charts, tables, and navigation in both themes.

Controls use a neutral 3 px focus ring, animated borders and shadows on focus and blur, and 150 ms color changes. Invalid inputs retain a destructive ring even when unfocused; file buttons use plain text, and input groups share one border and focus ring. Mobile inputs use 16 px text. Switch thumbs slide and dropdowns fade and scale in. Keyboard focus remains visible, including in forced-color mode; reduced motion disables transitions and animations.

Tables follow the [shadcn Data Table example](https://ui.shadcn.com/docs/components/base/data-table): 40 px headers, 8 px cell padding, natural row heights, and right-aligned amount cells. Body cells and rows stay transparent, including hover and selection states, so the container background shows through. Table headers and footers use `--surface-raised`. The transaction table has an 8 px rounded border; its toolbar and footer sit outside the border, with Previous/Next text buttons. The generic table container sits inside a themed `.card` with 12 px corners. Customer avatars and status badges remain part of the sample data layout.

Overlays follow the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Dialogs fade and scale by 5% over 100 ms, with a lightly tinted, blurred backdrop and a muted action footer. Side panels slide over 200 ms. Bootstrap sequences a 150 ms modal backdrop fade separately, so complete modal lifecycle timings include that extra phase. Tooltip, popover, toast, and tab fades use 150 ms; expanding sections use 100 ms.

Forms initially focus their first input; confirmations focus Cancel; informational overlays focus their heading. Background content is inert while an overlay is open, keyboard focus stays inside, and dismissal returns focus to the trigger. Form and confirmation dialogs follow [Carbon transactional dialog guidance](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines) with a static backdrop and Cancel, close, and Escape dismissal; information dialogs and notification panels also allow outside-click dismissal. Form drafts reset when closed on overlays marked `data-reset-on-close`. Long dialog bodies scroll while headers and actions stay visible.

Run `node checks/overlays.cjs` for overlay behavior checks, including initial focus, Tab wrapping, background inertness, outside-click behavior, draft reset, short-screen scrolling, and reduced motion. It accepts the same `CHROME_PATH` and `DASHBOARD_URL` options as the home check.

The date range selector follows the [AI Analytics reference](https://shadcnuikit.com/dashboard/ai-analytics): one month, Sunday-first weeks, previous/next navigation, highlighted endpoints and intervening days, and a custom-range dot with the dates in the button tooltip. It stays open while selecting; outside click, Escape, or a preset dismisses it. Arrow keys, Home/End, and Page Up/Down navigate dates. Custom analytics scale the monthly demo totals by inclusive calendar days; connect daily records for real reporting.
