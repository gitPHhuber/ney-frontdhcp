# Devtools console snapshot (2025-02-14)

## Overview
- Environment: `npm run dev` on Vite 6.3.6 using the HashRouter entry (`/#/`).
- Global styles (`src/styles/main.css` → `_app-shell.css`) now load, so Tailwind resets apply; however, the layout repeatedly remounts because `AppShell` sits both inside providers and as the router root.
- No duplicate React runtimes detected; only the single bundler copy is present.

## Console errors
- Every primary route (Dashboard, Inventory, Topology, Alerts, Incidents, Reports, Executive Dashboard, Automation, Product Passports, Settings, Navigation Check) spammed `Warning: Maximum update depth exceeded` originating from `AppShell`. This happens immediately after navigation and continues even while idle.
- React Router still prints the v7 future-flag warnings (informational but noisy).

## Network anomalies
- No 4xx/5xx responses recorded for JS or CSS chunks while traversing all routes.
- Stylesheets (`src/styles/main.css`, `styles/app/_app-shell.css`) were successfully requested and cached.

## Provider state
- All providers (Theme, Query, i18n, Auth, DhcpServer) mount correctly, but the Auth provider loops because `useEffect` updates auth state on every render when `BYPASS_AUTH` is enabled.
- Toast/Hotkeys providers stay initialised; no missing context errors observed.

## Layout observations
- Despite styles loading, the infinite re-render prevents interactions; sidebar flickers and the main content never stabilises.
- Logout button remains in the header, but the command palette and notifications cannot be opened due to the render loop.
