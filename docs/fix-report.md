# UI Stabilization Report

## Diagnostic findings
- Missing layout grid styles left the sidebar unbounded, typography unstyled, and header widgets misaligned.
- App shell re-rendered in a loop due to unstable hotkey registration, spamming console with `Maximum update depth exceeded`.
- Entry point mounted the router outside providers, risking duplicate React runtimes and inconsistent global state.
- Header widgets (notifications, command palette, guided tour) lacked accessibility affordances and visual polish.
- No automated guardrails existed for linting, type safety, or UI smoke flows.

> _До исправлений: макет AppShell имел расхождения по отступам, типографике и позиционированию виджетов._

## Remediation highlights
- Normalized the entry point to load a single React bundle, wrap routes with provider context, and render the AppShell as a layout outlet.
- Rebuilt the AppShell grid with a sticky header, fixed-width sidebar, scrollable content area, and list resets for consistent typography.
- Hardened theme tokens and base typography to respect dark/light modes and ensure readable contrasts.
- Refactored notifications into a badge-driven popover, added command palette focus management, and raised the guided-tour overlay z-index while enabling overlay dismissal.
- Memoized auth providers and sorted navigation health results to enforce strict RBAC guards and clearer diagnostics output.
- Added Playwright smoke tests covering shell load, menu navigation, and widget interactions; wired lint/typecheck/e2e into CI.

## Post-fix checklist
- AppShell renders without console errors across primary routes.
- Notifications popover, command palette (Cmd/Ctrl+K), and guided tour operate with accessible dialogs.
- Typography, spacing, and dark theme tokens align with design expectations.
- CI runs lint, typecheck, and e2e suites on every push/PR.

> _После исправлений: сетка AppShell, виджеты и типографика приведены к макету без визуальных артефактов._

## How to avoid regressions
1. **Entry order** – Keep `src/main.tsx` importing `./styles/main.css` first, then mount `<AppProviders>` and `<App />` only once.
2. **Router discipline** – Use the single `HashRouter` defined in `App.tsx`; avoid ad-hoc navigation or mixing routing strategies.
3. **Widget patterns** – Follow the notification popover and command palette implementations for aria attributes, focus traps, and keyboard handling.
4. **Provider stack** – Do not reorder the provider hierarchy in `AppProviders`; Theme → Auth → Query → i18n → Hotkeys → DhcpServer must remain intact.
5. **Continuous verification** – Run `npm run lint`, `npm run typecheck`, `npm run e2e`, and `npm run build` before merging UI-affecting changes.
