# Contracts: HTTP API (Draft)

**Feature**: 001-qr-loyalty-webapp  
**Date**: 2026-04-02

This document defines the minimal HTTP contracts needed to support the two web-apps.

## Conventions

- All timestamps are ISO-8601 UTC.
- `shopId`, `customerId`, `staffUserId` are opaque strings (UUID recommended).
- Errors return `{ "error": { "code": string, "message": string } }`.

## Customer App

### GET /public/shops/{shopId}/qr

Public endpoint used to generate the deterministic customer landing URL to be printed as the shop QR.

Response:
```json
{
  "shop": { "id": "string", "name": "string" },
  "url": "https://customer.example.com/shops/{shopId}"
}
```

### POST /customer/login

Login by entering phone/email (no OTP/password).

Request:
```json
{ "loginId": "string" }
```

Response:
```json
{ "customer": { "id": "string", "loginId": "string" }, "session": { "token": "string" } }
```

### GET /customer/shops/{shopId}/membership

Response:
```json
{
  "shop": { "id": "string", "name": "string" },
  "membership": {
    "customerId": "string",
    "displayName": "string",
    "pointsBalance": 123,
    "lastUpdatedAt": "2026-04-02T00:00:00Z"
  },
  "customerQr": { "value": "string" }
}
```

### PATCH /customer/shops/{shopId}/membership/display-name

Request:
```json
{ "displayName": "string" }
```

Response:
```json
{ "membership": { "displayName": "string" } }
```

## Merchant App

### POST /merchant/login

Request:
```json
{ "usernameOrEmail": "string", "password": "string", "shopId": "string" }
```

Response:
```json
{ "staffUser": { "id": "string", "displayName": "string" }, "session": { "token": "string" } }
```

### GET /merchant/shops/{shopId}/award-config

Response:
```json
{
  "defaultAwardPoints": 1,
  "awardPresets": [2,3,4],
  "dailyAwardLimitPerCustomer": 3
}
```

### POST /merchant/shops/{shopId}/award

Award points after scanning the customer QR.

Request:
```json
{ "customerQrValue": "string", "points": 2 }
```

Success response:
```json
{
  "transaction": { "id": "string", "pointsAwarded": 2, "createdAt": "2026-04-02T00:00:00Z" },
  "membership": { "customerId": "string", "pointsBalance": 125 }
}
```

Failure response examples:

- Limit exceeded:
```json
{ "error": { "code": "DAILY_LIMIT_REACHED", "message": "Customer reached daily award limit" } }
```

- Invalid QR:
```json
{ "error": { "code": "INVALID_CUSTOMER_QR", "message": "QR is invalid or unreadable" } }
```

## Dashboard

### GET /merchant/shops/{shopId}/dashboard?range=today|yesterday|last_week|last_month

Response:
```json
{
  "range": "today",
  "metrics": {
    "awardTransactions": 42,
    "pointsAwarded": 88,
    "uniqueCustomers": 31
  }
}
```
