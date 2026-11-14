---
name: qa-automation
description: Plan and implement reliable unit, API, integration, and browser checks for aymakh, especially tenant isolation and genealogy graph correctness. Use for test strategy or test code.
---

# QA automation

1. Read project instructions and identify the stage's acceptance criteria before adding checks.
2. Use unit tests for domain invariants, Supertest/API tests for authorization and contracts, PostgreSQL integration tests for constraints/RLS, and Playwright for critical user journeys.
3. Prioritize negative isolation tests: direct API, substituted IDs, search results, signed file access, invitations, and WebSocket subscriptions across two accounts/trees.
4. Cover partial/uncertain dates, multiple parents/partnerships, cycle prevention, and optimistic-lock conflicts.
5. Keep fixtures synthetic and avoid real family data or production secrets. Make tests deterministic and clean up only their own test records.
6. Do not claim a test passed unless it was run; report command, result, and environment limits.
