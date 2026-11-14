---
name: genealogy-database
description: Design or change aymakh's genealogical schema, facts, dates, people, relationships, events, and source citations. Use for PostgreSQL data model or genealogy integrity work.
---

# Genealogy database

1. Read `DATABASE.md` and inspect existing migrations/schema first.
2. Put every family-owned row under a `tree_id`; use same-tree composite foreign keys for references between family records.
3. Keep persons, typed relationships, partnerships, events, sources, citations, and media as separate entities. Never assume a fixed number of parents or marriages.
4. Represent uncertain, approximate, partial, ranged, and historical dates without inventing precision. Preserve original date text where useful.
5. Keep certainty/evidence separate from relationship or event type. Let one fact have multiple citations.
6. Prevent self-links and parent-child cycles in domain logic, including concurrent edits. Add database constraints for invariants the database can safely enforce.
7. Use a versioned migration, document backfill/rollback risks, and test cross-tree references and edge cases before calling the change complete.
