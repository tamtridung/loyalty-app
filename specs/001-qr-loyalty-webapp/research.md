# Research: QR Loyalty Points Web App

**Feature**: 001-qr-loyalty-webapp  
**Date**: 2026-04-02  
**Sources**: Spec + clarifications in spec.md (no external links yet)

## Decision 1: Single backend with two web apps

- **Decision**: Implement two mobile-first web apps (customer + merchant) backed by a shared API/data layer.
- **Rationale**: Keeps business rules consistent (award presets, daily limits, dashboards) and reduces duplicated logic across apps.
- **Alternatives considered**:
  - Two fully independent apps + duplicated logic → higher risk of mismatch.
  - One single UI app with role switching → conflicts with “2 web-app” requirement and complicates UX.

## Decision 2: Tech stack baseline for MVP

- **Decision**: TypeScript + Next.js (customer app + merchant app) + Tailwind CSS + Prisma + PostgreSQL.
- **Rationale**: Fast iteration for mobile web UI, strong typing for contracts, simple relational model for transactions and dashboards.
- **Alternatives considered**:
  - Firebase/Firestore → quicker start but harder aggregation for dashboards and auditing.
  - Separate backend framework (NestJS/Fastify) → more control but more setup for MVP.

## Decision 3: Customer identification without OTP/password

- **Decision**: Customer “login” is entering phone/email only; no OTP and no password.
- **Rationale**: Directly matches the product requirement and keeps checkout flow fast.
- **Risk**: Anyone who knows a phone/email can impersonate.
- **Mitigations (non-OTP/non-password, compatible with spec)**:
  - Merchant award requires scanning the customer’s QR presented on the customer device.
  - Server enforces per-customer-per-shop daily limit (default N=3, configurable).
  - Audit trail: every transaction stores staff identity, shop, time, and points.
  - Clear UI cues (masked identifier, last updated time) to reduce accidental mis-attribution.
- **Alternatives considered**:
  - OTP/SMS verification → rejected (explicitly out of scope).
  - Customer password/PIN → rejected (clarified as not allowed).

## Decision 4: Award points UX (preset buttons)

- **Decision**: Award points uses up to 3 configurable preset buttons (e.g., +2 +3 +4) with default +1.
- **Rationale**: Prevents manual input errors and keeps counter flow fast.
- **Alternatives considered**:
  - Free-form numeric input → higher error rate.
  - Always fixed +1 → too rigid for merchant needs.

## Decision 5: Duplicate prevention rule

- **Decision**: Limit awarding to max N successful point transactions per customer per shop per day (default N=3; configurable).
- **Rationale**: Simple to explain and audit; prevents rapid repeated awards.
- **Alternatives considered**:
  - Cooldown window only → still allows many awards per day.
  - 1/day hard limit → too restrictive.

## Decision 6: Dashboard aggregation windows

- **Decision**: Dashboard provides Today, Yesterday, Last Week, Last Month based on the shop’s local timezone.
- **Rationale**: Matches the requirement and typical merchant reporting expectations.
- **Alternatives considered**:
  - Custom date range filters → out of MVP scope.

## Open Items (deferred to implementation planning)

- Staff account lifecycle: who creates staff users, password reset flow, and role permissions.
- QR format: whether to encode customer identifier directly vs opaque token; trade-offs for privacy.
- Deployment: single domain with subpaths vs separate domains for customer/merchant.
