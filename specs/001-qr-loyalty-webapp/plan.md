# Implementation Plan: QR Loyalty Points Web App

**Branch**: `001-qr-loyalty-webapp` | **Date**: 2026-04-02 | **Spec**: specs/001-qr-loyalty-webapp/spec.md
**Input**: Feature specification from `/specs/001-qr-loyalty-webapp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a mobile-first QR loyalty points system with two web experiences: a customer web-app (view points, edit display name, show customer QR) and a merchant web-app (staff login, scan customer QR, award points with up to 3 configurable presets, see dashboard for today/yesterday/last week/last month). Proposed implementation uses a monorepo with two Next.js apps and a shared API/data layer backed by Postgres; core risks (customer login without OTP/password) are explicitly handled via clear auditing and limited operations.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Node.js LTS)  
**Primary Dependencies**: Next.js (2 apps: customer + merchant), Tailwind CSS, Prisma ORM, QR scanning library (e.g., ZXing)  
**Storage**: PostgreSQL  
**Testing**: Vitest + Playwright (critical flows)  
**Target Platform**: Mobile browsers (iOS Safari, Android Chrome) + server runtime for API  
**Project Type**: Web application (two mobile-first web-apps + shared backend)  
**Performance Goals**: Award points flow p95 ≤ 500ms server-side; scan-to-confirm UX ≤ 15s end-to-end under normal network  
**Constraints**: Minimal steps at counter; strong audit trail; customer identification uses phone/email without OTP/password  
**Scale/Scope**: MVP for single-region shops; supports multiple shops, staff accounts, and daily dashboards

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*


Source: `.specify/memory/constitution.md`

- **G1 Scope**: PASS — plan implements only customer + merchant flows from spec.
- **G2 Mobile UX**: PASS — primary tasks are designed to be ≤ 3 steps.
- **G3 Auditing**: PASS — every point transaction is attributable to a Staff User.
- **G4 Data minimization**: PASS — store minimal PII (phone/email as identifier, optional display name).
- **G5 Reliability**: PASS (planned) — requires idempotency/limits enforcement for award flow.
- **G6 Testability**: PASS (planned) — critical flows covered by automated tests.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
├── customer/              # Customer web-app: login, points, display name, customer QR
├── merchant/              # Merchant web-app: staff login, scan + award, dashboard
└── api/                   # API (or shared server) for auth, points, dashboard

packages/
├── domain/                # Shared domain types + validation
└── ui/                    # Shared UI primitives (mobile-first, minimal)

db/
└── prisma/                # Prisma schema + migrations

tests/
├── integration/           # API-level integration tests
└── e2e/                   # Playwright mobile-browser critical flows
```

**Structure Decision**: Monorepo with two web-apps (customer + merchant) and a shared API/data layer to ensure consistent rules for awarding points, limits, and dashboard aggregation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
