---
name: realtime-collaboration
description: Implement aymakh invitations, roles, comments, change history, notifications, and permission-checked WebSocket updates. Use for multi-user collaboration work.
---

# Realtime collaboration

1. Read `SECURITY.md`, `DATABASE.md`, and the current membership/role model.
2. Define allowed actions for owner, manager, editor, contributor, and viewer on the server; UI hiding is not authorization.
3. Hash invitation secrets, set expiry, bind them to a tree and intended role, support revocation, and consume them atomically.
4. Use optimistic versions for edits and return a clear conflict response instead of overwriting newer content.
5. Authenticate WebSocket connections and authorize each tree subscription. Revoke delivery after membership removal or role reduction.
6. Send minimal event payloads; fetch protected details through the authorized API. Persist durable notifications or changes before broadcasting.
7. Verify revoked invitations, role changes, conflicting writes, reconnects, and cross-tree subscriptions.
