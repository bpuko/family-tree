---
name: family-tree-ui
description: Build or improve the interactive, accessible, performant family tree canvas and relationship editing flows. Use for genealogy visualization UI work.
---

# Family tree UI

1. Read `AGENTS.md`, inspect the current UI, and identify the existing data/API contract.
2. Make the person the focus: support search, center-on-person, zoom, pan, branch collapse/expand, and clear relationship types.
3. Load graph branches on demand; do not request or render the entire large tree by default. Keep stable IDs and avoid unnecessary node redraws.
4. Make add-parent, add-child, add-partner, and edit-person actions real API-backed flows with validation and optimistic version handling.
5. Handle loading, empty, permission-denied, conflict, and network-error states in Russian. Do not silently overwrite another editor's changes.
6. Check keyboard access, touch targets, small screens, and understandable relationship lines. Keep sensitive fields out of URLs and public metadata.
7. Run only the relevant checks when requested or required by the current stage, and report what was actually verified.
