---
name: devops-deployment
description: Prepare or operate aymakh's self-hosted deployment, process configuration, TLS, monitoring, and release checks. Use for VPS or production operations.
---

# DevOps and deployment

1. Read `DEPLOYMENT.md` if present, `SECURITY.md`, Compose files, and current VPS assumptions.
2. Keep web, API, and worker as separate processes within the modular monolith. Keep PostgreSQL and object storage private to the application network.
3. Pin dependency and container versions; commit the package lock. Do not place secrets in source control or logs.
4. Require health checks, bounded resources, restart behavior, structured logs, and operational visibility for queues and storage.
5. Before release, check migration compatibility, rollback strategy, HTTPS/cookies, origin configuration, and backup freshness.
6. Do not deploy, change DNS, or run destructive operations without explicit authorization. Preserve the existing disk and data.
7. Record exact commands, observed service health, and unresolved operational risks.
