---
trigger: always_on
description: Use the local Graphify graph before broad repository search for architecture, impact, debugging, or unfamiliar code.
---

## Graphify-first navigation

Read `Architecture/GRAPHIFY_GUIDE.md`.

- For architecture, impact, debugging, or unfamiliar code, check `graphify-out/graph.json`, then derive 1–2 symbol anchors.
- Run `env -u PYTHONPATH graphify explain|affected|path` before broad filesystem search. Use `query` only when an anchor is unknown or broader traversal is needed.
- Convert graph results into a minimal file list. Pack only that list with Repomix; then read exact current source ranges.
- Filesystem search is fallback-only when graph is missing, stale, or cannot represent the target. State the exact gap first.
- Source, OpenAPI, schema, tests, and runtime remain authoritative. Never edit generated graph output as a substitute for source.
- Refresh with `env -u PYTHONPATH graphify update .` after a verified module/feature changes dependencies; skip refresh for copy/CSS-only edits.
