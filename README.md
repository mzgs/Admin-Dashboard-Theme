# Admin Dashboard Theme

Open `index.html` for the design template. Home contains the full component showcase, grouped into Foundations, Buttons & badges, Form controls, Navigation, Feedback & states, Overlays, Cards & lists, and Dashboard & data display. The left menu links to these groups and the transaction, task, and table examples with `#` IDs.

The Bootstrap showcase includes typography, color swatches, icons, avatars, button variants and sizes, badges, native form inputs and validation states, tabs, accordion, breadcrumbs, dropdowns, pagination, alerts, loading skeletons, empty states, dialogs, side panels, toasts, tooltips, popovers, lists, card layouts, carousel, collapsible content, and progress bars. Dashboard patterns include sample analytics, line/donut/bar charts, searchable and paginated transactions, CSV exports, and task management. Shared CSS theme tokens style neutral buttons, inputs, cards, tabs, badges, menus, and dialogs in light and dark mode. Transactions and tasks live for the current page session; theme and workspace preferences use browser storage.

Serve locally with `python3 -m http.server 8000`, then visit `http://localhost:8000/index.html`. Bootstrap and Font Awesome load from the existing CDN links, so an internet connection is required.

Use `--background` for the page canvas, `--surface` for element backgrounds, and `--surface-raised` for raised or hover states. Apply `bg-surface` or `bg-surface-raised` to any element; both follow the active light or dark theme. Cards, controls, tables, menus, and overlays share the surface token. The Foundations palette previews all three background colors.

With Playwright available, run `node checks/home.cjs` against the local server for the browser smoke check. Set `CHROME_PATH` to use an installed Chrome executable, or `DASHBOARD_URL` to check another local server.

Controls use [shadcn-style focus feedback](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/input.tsx): a neutral 3 px ring, animated borders and shadows on both focus and blur, and 150 ms color changes for buttons, tabs, navigation, menu items, table rows, and form controls. Switch thumbs slide, dropdowns fade and scale in, and validation rings follow their error or success color. Keyboard focus remains visible, including in forced-color mode; reduced motion disables transitions and animations.

Overlays follow the [WAI-ARIA modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), with 250 ms entrances and 200 ms exits. Dialogs use a subtle fade and 2% scale; side panels slide from and return to their edge. Bootstrap sequences a 150 ms modal backdrop fade separately, so complete modal lifecycle timings include that extra phase. Tooltip, popover, toast, and tab fades use 150 ms; expanding sections use 250 ms.

Forms initially focus their first input; confirmations focus Cancel; informational overlays focus their heading. Background content is inert while an overlay is open, keyboard focus stays inside, and dismissal returns focus to the trigger. Form and confirmation dialogs follow [Carbon transactional dialog guidance](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines) with a static backdrop and Cancel, close, and Escape dismissal; information dialogs and notification panels also allow outside-click dismissal. Form drafts reset when closed. Long dialog bodies scroll while headers and actions stay visible.

Run `node checks/overlays.cjs` for overlay behavior checks, including initial focus, Tab wrapping, background inertness, outside-click behavior, draft reset, short-screen scrolling, and reduced motion. It accepts the same `CHROME_PATH` and `DASHBOARD_URL` options as the home check.
