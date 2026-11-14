---
name: fullstack-development
description: Implement an end-to-end aymakh feature across web, API, persistence, and worker while preserving module boundaries. Use for product feature work spanning layers.
---

# Full-stack development

1. Read project instructions, roadmap, API contract, and affected modules before editing.
2. Trace the feature from user action through API, domain service, repository, database migration, and any worker event. Do not substitute mock data for backend behavior.
3. Keep validation and business rules on the server. Keep UI state and presentation in the web layer.
4. For tree-owned records, enforce membership, role, and `tree_id` on every read and write; account for RLS transaction context.
5. Add version checks for concurrent edits and outbox events in the same transaction when asynchronous work is required.
6. Update API and architecture docs when contracts or boundaries change. Avoid unrelated refactors.
7. Verify the feature with relevant checks and explain any unverified behavior honestly.
