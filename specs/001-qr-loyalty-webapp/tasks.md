# Tasks: QR Loyalty Points Web App

**Input**: Design documents from `/specs/001-qr-loyalty-webapp/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md  
**Tests**: Not explicitly requested in spec → tasks below focus on implementation + manual validation checkpoints.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Descriptions include concrete file paths (files or directories)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize repository code structure to match plan.md

 - [x] T001 Create monorepo directory layout in `apps/customer/`, `apps/merchant/`, `apps/api/`, `packages/domain/`, `packages/ui/`, `db/prisma/`, `tests/`
 - [x] T002 Initialize workspace root `package.json` with npm workspaces and shared scripts (`lint`, `typecheck`) in `package.json`
 - [x] T003 [P] Scaffold Next.js + Tailwind app for customer in `apps/customer/` (including `apps/customer/next.config.js`, `apps/customer/tailwind.config.ts`)
- [x] T004 [P] Scaffold Next.js + Tailwind app for merchant in `apps/merchant/` (including `apps/merchant/next.config.js`, `apps/merchant/tailwind.config.ts`)
- [x] T005 [P] Scaffold API app in `apps/api/` (Next.js route handlers) with `apps/api/src/app/api/` structure
- [x] T006 [P] Add shared TypeScript configs in `tsconfig.base.json`, `apps/customer/tsconfig.json`, `apps/merchant/tsconfig.json`, `apps/api/tsconfig.json`
- [x] T007 [P] Configure formatting baseline in `.prettierrc`, `.editorconfig` (Next.js templates already provide per-app `eslint.config.mjs`)
- [x] T008 Add environment templates for local dev in `.env.example` and `apps/api/.env.example`

**Checkpoint**: Repo builds locally and apps can start in dev mode.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data layer + core security/audit plumbing required by all stories

- [x] T009 Setup Prisma schema in `db/prisma/schema.prisma` based on `specs/001-qr-loyalty-webapp/data-model.md`
- [x] T010 Add Prisma client package wiring in `apps/api/package.json` and `apps/api/src/lib/prisma.ts`
- [x] T011 Implement database migration workflow (scripts) in root `package.json` and `db/prisma/`
- [x] T012 Implement data normalization helpers for phone/email in `apps/api/src/lib/identifiers.ts`
- [x] T013 Implement customer session issuance for “loginId only” in `apps/api/src/lib/customerSession.ts` and route `apps/api/src/app/api/customer/login/route.ts`
- [x] T014 Implement merchant (staff) authentication (username/email + password) in `apps/api/src/lib/merchantAuth.ts` and route `apps/api/src/app/api/merchant/login/route.ts`
- [x] T015 Implement API error response shape + helper in `apps/api/src/lib/httpErrors.ts`
- [x] T016 Create seed/dev fixtures (1 shop, 1 staff, sample config) in `apps/api/src/scripts/seed.ts`
- [x] T017 Implement shop config endpoint `apps/api/src/app/api/merchant/shops/[shopId]/award-config/route.ts`
- [x] T018 Decide and implement customer QR encoding/decoding (opaque signed token recommended) in `apps/api/src/lib/customerQr.ts`

**Checkpoint**: API can create customer session, merchant session, and returns award config for a seeded shop.

---

## Phase 3: User Story 1 — Tích điểm bằng QR tại quán (Priority: P1) 🎯 MVP

**Goal**: End-to-end points awarding flow using QR: customer view shows points + customer QR; merchant scans QR and awards with presets.

**Independent Test**: With seeded shop + staff, using two phones: customer logs in and shows QR; merchant logs in, scans, chooses preset, sees success; customer points increase.

### Implementation for User Story 1

- [x] T019 [P] [US1] Implement customer “shop landing” route in `apps/customer/src/app/shops/[shopId]/page.tsx` (reads shopId from URL)
- [x] T020 [P] [US1] Implement customer login UI (phone/email input) in `apps/customer/src/app/shops/[shopId]/login/page.tsx`
- [x] T021 [P] [US1] Implement customer API client wrappers in `apps/customer/src/lib/api.ts` for `/customer/login` and `/customer/shops/{shopId}/membership`
- [x] T022 [US1] Implement customer membership API route in `apps/api/src/app/api/customer/shops/[shopId]/membership/route.ts`
- [x] T023 [US1] Implement customer QR value generation returned by membership endpoint in `apps/api/src/app/api/customer/shops/[shopId]/membership/route.ts`
- [x] T024 [P] [US1] Implement customer points + QR screen in `apps/customer/src/app/shops/[shopId]/membership/page.tsx`
- [x] T025 [P] [US1] Implement merchant login UI in `apps/merchant/src/app/login/page.tsx`
- [x] T026 [P] [US1] Implement merchant API client wrappers in `apps/merchant/src/lib/api.ts` for `/merchant/login`, `/merchant/shops/{shopId}/award-config`, `/merchant/shops/{shopId}/award`
- [x] T027 [P] [US1] Implement QR scanning UI (camera permission + scan) in `apps/merchant/src/app/scan/page.tsx`
- [x] T028 [US1] Implement award service: daily limit enforcement (default N=3), preset validation, write transaction, update balance in `apps/api/src/services/awardPoints.ts`
- [x] T029 [US1] Implement award endpoint `apps/api/src/app/api/merchant/shops/[shopId]/award/route.ts` calling `apps/api/src/services/awardPoints.ts`
- [x] T030 [US1] Implement merchant scan+award screen with up to 3 preset buttons + default +1 in `apps/merchant/src/app/award/page.tsx`
- [x] T031 [US1] Show award success/failure message in `apps/merchant/src/app/award/page.tsx` (success toast/banner)
- [x] T032 [US1] Ensure customer UI reflects updated points after award by re-fetching membership on user action (e.g., refresh) in `apps/customer/src/app/shops/[shopId]/membership/page.tsx`
- [x] T033 [US1] Add edge-case handling (invalid QR, limit reached, unauthorized) in `apps/merchant/src/app/award/page.tsx` and `apps/api/src/lib/httpErrors.ts`

**Checkpoint**: US1 is demoable end-to-end on two phones.

---

## Phase 4: User Story 2 — Khách đổi tên hiển thị (Priority: P2)

**Goal**: Customer can edit display name; fallback shows loginId when unset.

**Independent Test**: Customer logs in, changes display name, reloads and sees persisted name; if cleared, UI falls back to phone/email.

- [x] T034 [US2] Add API route to update display name in `apps/api/src/app/api/customer/shops/[shopId]/membership/display-name/route.ts`
- [x] T035 [P] [US2] Add customer UI form to edit display name in `apps/customer/src/app/shops/[shopId]/membership/edit-name/page.tsx`
- [x] T036 [US2] Wire customer UI to PATCH endpoint in `apps/customer/src/lib/api.ts`
- [x] T037 [US2] Implement fallback rule (if no displayName, show loginId) in `apps/customer/src/app/shops/[shopId]/membership/page.tsx`

**Checkpoint**: Display name updates persist and fallback works.

---

## Phase 5: User Story 3 — Quán xem dashboard tình hình tích điểm (Priority: P3)

**Goal**: Merchant can view dashboard metrics for today/yesterday/last week/last month.

**Independent Test**: Seed some transactions; switch ranges and verify counts/sums/distinct customers match expected totals.

- [x] T038 [US3] Implement dashboard aggregation service in `apps/api/src/services/dashboardMetrics.ts` (transactions count, points sum, unique customers)
- [x] T039 [US3] Implement dashboard endpoint in `apps/api/src/app/api/merchant/shops/[shopId]/dashboard/route.ts` supporting `range=today|yesterday|last_week|last_month`
- [x] T040 [P] [US3] Implement merchant dashboard UI page in `apps/merchant/src/app/dashboard/page.tsx` with 4 range buttons
- [x] T041 [US3] Wire dashboard API client call in `apps/merchant/src/lib/api.ts` and render metrics in `apps/merchant/src/app/dashboard/page.tsx`

**Checkpoint**: Dashboard shows correct metrics for each range.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, consistency, and operational readiness

- [x] T042 [P] Add minimal access logging for award + dashboard in `apps/api/src/lib/auditLog.ts` and call sites in `apps/api/src/services/awardPoints.ts`
- [x] T043 Ensure all API routes consistently return error codes/messages per contract in `specs/001-qr-loyalty-webapp/contracts/http-api.md`
- [x] T044 Mobile UX pass: tighten spacing/tap targets and ensure one-handed use on key screens in `apps/customer/src/app/**` and `apps/merchant/src/app/**`
- [x] T045 Document local dev + seed usage updates in `specs/001-qr-loyalty-webapp/quickstart.md`

---

## Phase 7: Consistency Gates (Reliability + Testability)

**Purpose**: Satisfy constitution gates G5 (idempotency) and G6 (automated tests)

- [x] T046 [US1] Implement shop QR generation (deterministic URL) and document printing flow in `apps/api/src/app/api/public/shops/[shopId]/qr/route.ts` + `specs/001-qr-loyalty-webapp/quickstart.md`
- [x] T047 [US1] Implement idempotent award handling for retries (dedupe within short window per staff+customer+points) in `apps/api/src/services/awardPoints.ts`
- [x] T048 [P] [US1] Add automated service-level test for daily limit + dedupe behavior in `apps/api/src/services/__tests__/awardPoints.test.ts`
- [x] T049 [P] [US1] Add one Playwright smoke test for merchant login → award happy path in `tests/e2e/merchant-award.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → blocks all other work
- **Foundational (Phase 2)** depends on Setup → blocks all user stories
- **US1 (Phase 3)** depends on Foundational
- **US2 (Phase 4)** depends on US1 (needs membership & customer session)
- **US3 (Phase 5)** depends on US1 (needs point transactions)
- **Polish (Phase 6)** depends on desired user stories being complete

### User Story Dependency Graph

- Setup → Foundational → US1 → {US2, US3}

### Parallel Opportunities

- In Phase 1, app scaffolding tasks T003–T006 can run in parallel.
- In Phase 3 (US1), customer UI tasks (T019–T024) can proceed in parallel with merchant UI tasks (T025–T031) once API routes exist.
- In Phase 5 (US3), dashboard UI (T040) can run in parallel with API (T038–T039).

---

## Parallel Example: User Story 1

- Customer app UI in `apps/customer/src/app/shops/[shopId]/` (T019, T020, T024)
- Merchant app UI in `apps/merchant/src/app/` (T025, T027, T030, T031)
- API services/routes in `apps/api/src/services/` + `apps/api/src/app/api/` (T022, T028, T029)

## Parallel Example: User Story 3

- API aggregation + endpoint in `apps/api/src/services/dashboardMetrics.ts` and `apps/api/src/app/api/merchant/shops/[shopId]/dashboard/route.ts` (T038–T039)
- Merchant dashboard UI in `apps/merchant/src/app/dashboard/page.tsx` (T040–T041)

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Setup + Foundational (Phases 1–2)
2. Implement US1 (Phase 3)
3. Validate end-to-end scan → award → points updated using two phones

### Incremental Delivery

- Add US2 (display name) after US1 is stable
- Add US3 (dashboard) after transactions exist
