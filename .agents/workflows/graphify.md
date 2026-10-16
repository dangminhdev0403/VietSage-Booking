---
name: graphify
description: Build, refresh, and query the booking-manager code knowledge graph
---

# Workflow: Graphify

Canonical instructions: `Architecture/GRAPHIFY_GUIDE.md`.

```bash
uv tool install --upgrade graphifyy
env -u PYTHONPATH graphify --version
env -u PYTHONPATH graphify update .
```

Query symbol-first:

```bash
env -u PYTHONPATH graphify explain "<Symbol>" --all
env -u PYTHONPATH graphify affected "<Symbol>" --depth 2
env -u PYTHONPATH graphify path "<A>" "<B>"
```

Keep `graphify-out/` local/ignored. Use Graphify to choose a bounded Repomix pack; verify conclusions against exact source.
