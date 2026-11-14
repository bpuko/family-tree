---
name: global-search
description: Design or implement private search across people, names, dates, places, events, and biographies using PostgreSQL FTS and pg_trgm. Use for indexing or search behavior.
---

# Global search

1. Read `SEARCH.md` if present, plus `DATABASE.md` and the current authorization path.
2. Build search projections from committed changes through the transactional outbox; make worker handlers idempotent and observable.
3. Carry `tree_id` through every indexed record and query. Restrict candidate trees using active membership before returning results; re-check access when rendering results.
4. Use PostgreSQL full-text search and `pg_trgm` for the first version. Normalize Cyrillic carefully and preserve original spellings/alternate names.
5. Add bounded pagination, filters, stable sorting, and safe highlighting. Do not expose counts or suggestions from inaccessible trees.
6. Plan index rebuilds and deletion propagation. Keep the schema ready for a future search engine without coupling core writes to it.
7. Test misspellings, partial matches, Cyrillic, revoked membership, cross-tree ID substitution, and stale index entries.
