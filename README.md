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

├── shared/                  # Config, hooks, UI primitives, utilities
└── styles/                  # Design tokens and component/page styles
```



### Feature scaffolds

| Area | Highlights |
| --- | --- |
| Inventory (`features/inventory/InventoryTable.tsx`) | Virtualised TanStack Table with inline edit stub, export presets hooks, performance markers. |

| Topology (`features/topology/TopologyCanvas.tsx`) | Cytoscape canvas with layout switching placeholder and animated status badges. |
| Reports (`features/reports/ReportsBuilderCanvas.tsx`) | Drag-and-drop ready form with preset selection and export CTAs. |
| Automation (`features/automation/PlaybookList.tsx`) | Playbook list with dry-run/launch slots and risk scoring badges. |
| Product Passports (`features/product-passport/ProductPassportWizard.tsx`) | Multi-step wizard capturing the data model required for enterprise passports. |

Executive dashboards, incidents, alerts, and change calendars are stubbed as contextual `PagePlaceholder` blocks ready to be expanded with real data.

### Observability & UX aids

* **Notification Center** accumulates non-P1/P2 alerts, while critical ones can surface through the Sonner toaster.

* **Guided tour** and inline hints accelerate onboarding with links to documentation stubs.
* **Performance tooling** via `shared/lib/performance.ts` exposes `startMeasure/endMeasure` helpers to instrument heavy tables/topology renders.

### Feature flags & caching


