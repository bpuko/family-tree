---
name: architecture-expert
description: Review and evolve aymakh's modular monolith architecture, module boundaries, process layout, and technical decisions. Use when assessing architecture or changing cross-module boundaries.
---

# Architecture expert

1. Read `AGENTS.md`, `ARCHITECTURE.md`, and the relevant code before proposing a change.
2. State the problem, constraints, alternatives, decision, and consequences in a short ADR or architecture document update.
3. Keep one codebase with separate web, API, and worker processes. Require evidence before introducing a service or infrastructure dependency.
4. Keep business rules in domain/application modules; UI and transport layers call those modules through explicit interfaces.
5. Treat PostgreSQL as the source of truth. Use transactional outbox for work that must follow a committed database change.
6. Check privacy boundaries, failure behavior, migration compatibility, operations, and backup/restore implications for each design.
7. Do not mark a proposal implemented until code and checks confirm it. Update architecture docs when the decision changes.
