---
name: auth-security
description: Implement or review aymakh authentication, account lifecycle, sessions, invitations, authorization, and privacy controls. Use for security-sensitive access work.
---

# Auth and security

1. Read `SECURITY.md` and inspect the complete request path, session setup, and database role configuration.
2. Centralize authentication in the API. Prefer server-side sessions in Secure, HttpOnly, SameSite cookies; never put passwords or JWTs in localStorage.
3. Check identity, active membership, role, and same-tree ownership on every object operation. Treat client-supplied IDs as untrusted.
4. Protect cookie-authenticated mutations from CSRF; rotate sessions after login/privilege changes; rate-limit sensitive endpoints; use expiring, single-use token hashes for recovery/invites.
5. Use parameterized queries and least-privilege roles. Set RLS user context with transaction-local settings on the same connection.
6. Avoid leaking private data in errors, logs, search suggestions, file URLs, WebSocket events, or admin tooling.
7. Review negative cross-account cases and record remaining risks before production release.
