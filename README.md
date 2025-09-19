<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1vJUWFKNX0oHEroCiWzTV7a5GBgnFcNAl

## Run Locally

**Prerequisites:** Node.js 20+

```bash
npm install
MOCK_API=1 BYPASS_AUTH=1 npm run dev
```

The development server boots with authentication bypassed (auto-login as `admin`) and with the mock API adapters enabled. These flags emulate Prometheus/SNMP/NetFlow/Loki integrations without reaching real endpoints.

## Architecture snapshot

```
src/
├── app/                     # App shell, router, providers
├── pages/                   # Top-level routed screens
├── widgets/                 # Cross-cutting UI widgets (command palette, notifications, guided tour)
├── features/                # Feature slices (inventory table, topology canvas, reports builder...)
├── entities/                # Domain models + mock repositories (ERP/MES/Tasks/Passports)
├── shared/                  # Config, hooks, UI primitives, utilities
└── styles/                  # Design tokens and component/page styles
```

`src/app/providers.tsx` wires Theme, TanStack Query, i18n, Hotkeys, legacy DHCP contexts, an error boundary, and the global toaster. Routes are hash-based and lazy-loaded for code-splitting; Suspense fallbacks use lightweight skeletons.

## Enterprise extensions

* **ERP slice** — `pages/erp/*` renders the catalogue, warehouses, and purchasing/sales flows on top of the in-memory repositories. CSV export and TanStack Virtual ensure 100k row scalability.
* **MES slice** — `pages/mes/ProductionPage.tsx` visualises production orders, work-centre load, quality gates, and maintenance windows. Completing a work order consumes BOM components and moves finished goods.
* **Task board** — `pages/tasks/TaskBoardPage.tsx` provides a Kanban board with native drag/drop, sprint context, and a live timesheet sidebar.
* **Global hotkeys** — `shared/hotkeys/*` exposes a `HotkeysProvider` so modules can register interactions (e.g. `Cmd/Ctrl+K` for the command palette) without manual `window` listeners.

Mock repositories in `src/entities` persist the MES/ERP/Task state during a dev session. They are ready to be swapped for REST/GraphQL adapters by implementing the same interfaces.

### Feature scaffolds

| Area | Highlights |
| --- | --- |
| Inventory (`features/inventory/InventoryTable.tsx`) | Virtualised TanStack Table with inline edit stub, export presets hooks, performance markers. |
| ERP catalogue (`features/erp/CatalogTables.tsx`) | Unified view of items, BOMs, warehouses, and purchase/sales orders with CSV export. |
| MES dashboard (`features/mes/ProductionDashboard.tsx`) | Production order progress, work-centre load, quality, and maintenance snapshots tied to stock moves. |
| Task board (`features/tasks/TaskBoard.tsx`) | Drag/drop Kanban with WIP limits, sprint meta, and timesheet telemetry. |
| Topology (`features/topology/TopologyCanvas.tsx`) | Cytoscape canvas with layout switching placeholder and animated status badges. |
| Reports (`features/reports/ReportsBuilderCanvas.tsx`) | Drag-and-drop ready form with preset selection and export CTAs. |
| Automation (`features/automation/PlaybookList.tsx`) | Playbook list with dry-run/launch slots and risk scoring badges. |
| Product Passports (`features/product-passport/ProductPassportWizard.tsx`) | Multi-step wizard capturing the data model required for enterprise passports. |

Executive dashboards, incidents, alerts, and change calendars are stubbed as contextual `PagePlaceholder` blocks ready to be expanded with real data.

### Observability & UX aids

* **Notification Center** accumulates non-P1/P2 alerts, while critical ones can surface through the Sonner toaster.
* **Command Palette (`Cmd/Ctrl+K`)** enables quick navigation to nodes, metrics, reports, or playbooks and is powered by the shared hotkey registry.
* **Guided tour** and inline hints accelerate onboarding with links to documentation stubs.
* **Performance tooling** via `shared/lib/performance.ts` exposes `startMeasure/endMeasure` helpers to instrument heavy tables/topology renders.

### Feature flags & caching

Feature availability is controlled via `shared/config/featureFlags.ts`. Toggle flags to stage UI variants or gate new topology layouts/playbook engines (ERP/MES/Taskboard slices are behind `erp-suite`, `mes-suite`, and `taskboard-suite`).

TanStack Query cache keys follow a hierarchical convention (`inventory/`, `metrics/`, `alerts/*`) defined in `shared/api/queryKeys.ts`, simplifying selective invalidation.

### Data flows & integrations

* **PO → Stock → MES** — receiving a purchase order via `erpRepository.receivePurchaseOrder` creates stock lots and moves them to raw inventory.
* **Production → Work orders** — `mesRepository.generateWorkOrders` instantiates routings for each production order; completing the first operation issues components and the last operation moves finished goods to FG storage.
* **Task telemetry** — the task board records drag/drop state through `tasksRepository.moveTask`, while timesheets expose labour distribution per task/work order.

Swap the in-memory repositories for real adapters by conforming to the same method signatures (`src/entities/*/mockRepository.ts`).
