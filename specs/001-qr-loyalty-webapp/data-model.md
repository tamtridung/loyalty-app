# Data Model: QR Loyalty Points Web App

**Feature**: 001-qr-loyalty-webapp  
**Date**: 2026-04-02

## Entities

### Shop

Represents a merchant location/program.

- `id` (string/uuid)
- `name` (string)
- `timezone` (string, IANA tz; used for dashboard windows and daily limits)
- `createdAt` (datetime)
- `status` (active/inactive)

**Config (per shop)**
- `defaultAwardPoints` (int, default 1)
- `awardPresets` (array<int>, size 0..3; example: [2,3,4])
- `dailyAwardLimitPerCustomer` (int, default 3)

### StaffUser

Represents a staff account that can award points and view merchant dashboard.

- `id` (string/uuid)
- `shopId` (FK → Shop)
- `usernameOrEmail` (string, unique within shop)
- `passwordHash` (string)
- `displayName` (string, optional)
- `role` (owner/manager/staff)
- `status` (active/disabled)
- `createdAt` (datetime)
- `lastLoginAt` (datetime, optional)

### Customer

Represents an end customer identified by phone or email.

- `id` (string/uuid)
- `loginId` (string, normalized; phone or email; unique)
- `loginType` (enum: phone/email)
- `createdAt` (datetime)

### Membership

Customer’s membership at a shop (points balance + display name).

- `id` (string/uuid)
- `shopId` (FK → Shop)
- `customerId` (FK → Customer)
- `displayName` (string, optional; defaults to `loginId` for UI)
- `pointsBalance` (int, non-negative)
- `updatedAt` (datetime)

**Constraints**
- Unique `(shopId, customerId)`

### PointTransaction

One award operation.

- `id` (string/uuid)
- `shopId` (FK → Shop)
- `staffUserId` (FK → StaffUser)
- `customerId` (FK → Customer)
- `pointsAwarded` (int, > 0)
- `status` (success/failed)
- `failureReason` (string, optional)
- `createdAt` (datetime)

**Derived/Reporting fields (optional)**
- `shopLocalDate` (date; derived from `createdAt` + `shop.timezone` for limit enforcement and dashboards)

## Relationships

- Shop 1—N StaffUser
- Shop 1—N Membership
- Customer 1—N Membership
- Shop 1—N PointTransaction
- StaffUser 1—N PointTransaction
- Customer 1—N PointTransaction

## Validation & Business Rules (from spec)

- Award presets: up to 3 values per shop; if none configured, only default award applies.
- Daily award limit: per (shop, customer, shopLocalDate) maximum N successful transactions; default N=3.
- Every successful award updates Membership.pointsBalance and writes a successful PointTransaction.
- All awards must be attributable to a StaffUser.

## Indexing (implementation guidance)

- `Customer.loginId` unique index.
- `Membership (shopId, customerId)` unique index.
- `PointTransaction (shopId, customerId, createdAt)` for dashboard queries.
- `PointTransaction (shopId, customerId, shopLocalDate)` for daily limit enforcement.
