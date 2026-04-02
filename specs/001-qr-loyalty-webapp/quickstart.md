# Quickstart: QR Loyalty Points Web App

**Feature**: 001-qr-loyalty-webapp  
**Date**: 2026-04-02

This quickstart covers local development for the implemented monorepo.

## Prerequisites

- Node.js (LTS)
- PostgreSQL

## Workspace layout

- `apps/customer` — customer web-app
- `apps/merchant` — merchant web-app
- `apps/api` — shared backend/API
- `packages/*` — shared domain + UI primitives
- `db/prisma` — schema + migrations

## Environment variables

- API (`apps/api/.env`)
   - `DATABASE_URL`
   - `CUSTOMER_SESSION_SECRET`
   - `MERCHANT_SESSION_SECRET`
   - `CUSTOMER_QR_SECRET`
   - `APP_BASE_URL_CUSTOMER` (used for printing shop QR)
- Customer (`apps/customer/.env.local`)
   - `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`)
- Merchant (`apps/merchant/.env.local`)
   - `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001`)

## Run locally

1. Install dependencies
   - `npm install`
2. Configure env
   - Copy `apps/api/.env.example` → `apps/api/.env`
   - Copy `apps/customer/.env.example` → `apps/customer/.env.local`
   - Copy `apps/merchant/.env.example` → `apps/merchant/.env.local`
3. Set up database
   - Ensure Postgres is running and `DATABASE_URL` is correct
   - `npm run db:migrate`
   - `npm run db:seed`
4. Run dev servers
   - `npm run dev`
5. Open apps
   - Customer: `http://localhost:3000/shops/demo-shop`
   - Merchant: `http://localhost:3002/login`
   - API: `http://localhost:3001/api/*`

## Sanity checks

- Customer: login (phone/email only) → see points + customer QR → edit display name.
- Merchant: staff login → scan QR → choose preset (+1/+2/+3) → award success toast.
- Dashboard: today/yesterday/last week/last month aggregates.

## Shop QR printing flow

1. Get the deterministic customer landing URL for a shop:
   - `GET http://localhost:3001/api/public/shops/{shopId}/qr`
2. Generate a QR code image from the returned `url` and print it for the shop counter.

## E2E smoke test

- Install Playwright browsers once:
   - `npx playwright install`
- Start the stack (`npm run dev`) and ensure DB is migrated/seeded, then:
   - `npm run test:e2e`

