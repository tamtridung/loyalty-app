# Project Constitution (scoring-app)

## Principles

1. **Mobile-first usability**: Primary flows must work one-handed on a phone.
2. **MVP-first**: Prefer the smallest shippable slice; avoid optional features unless required by spec.
3. **Clarity over cleverness**: Keep flows and data model simple and auditable.
4. **Security & privacy baseline**: Minimize sensitive data, log access, and make risky choices explicit.
5. **Measurable outcomes**: Every major feature should have acceptance scenarios and measurable success criteria.

## Gates (used in plans)

- **G1 Scope**: Only implement what the spec describes; no extra pages/flows.
- **G2 Mobile UX**: Primary tasks are achievable in ≤ 3 steps.
- **G3 Auditing**: Point transactions must be attributable (who/when/where/how many points).
- **G4 Data minimization**: Store only what’s needed to operate (phone/email as identifier, minimal PII).
- **G5 Reliability**: Points updates must be consistent and idempotent (no accidental double-award).
- **G6 Testability**: Core flows have automated tests at least at API/service level.

## Notes

- Customer login without OTP/password is inherently risky; plans must document risk acceptance and mitigations that do not violate the spec.
