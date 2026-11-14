---
name: media-storage
description: Implement private photo/document upload, preview, thumbnail, album, and retention flows using S3-compatible storage. Use for family archive or file access work.
---

# Media storage

1. Read `SECURITY.md`, inspect current object storage configuration, and identify tree and object authorization.
2. Keep buckets private. Use opaque object keys and never persist or return permanent public URLs.
3. Authorize upload intent, download, preview, deletion, and restore against the owning tree and role. Use short-lived signed URLs only after authorization.
4. Enforce size limits, extension/MIME allowlists, content inspection, checksums, and safe filenames. Treat claimed MIME as untrusted.
5. Store metadata and processing state in PostgreSQL; store bytes in S3-compatible storage. Coordinate asynchronous thumbnails through outbox and make jobs retry-safe.
6. Model trash/restore and retention explicitly. Do not physically purge recoverable content before the agreed retention window.
7. Test wrong-tree access, tampered keys, expired links, corrupt uploads, and cleanup failure.
