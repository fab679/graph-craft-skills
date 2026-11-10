---
name: graph-craft
description: Operate a graph-craft project over MCP — explore graphs, answer questions, write nodes and edges, and drive the live canvas. Use when a task involves a graph-craft project, its API key, or its MCP endpoint.
---

# graph-craft

A graph-craft project is a live graph workspace. **Data writes are durable; canvas commands are live and best-effort; every request is scoped by the API key.**

## Install this skill pack

```bash
npx graph-craft-skills
```

Installs every skill below into `~/.agents/skills/` and symlinks them into the agent directories it detects (Claude Code, Codex, OpenCode, Gemini, Antigravity, Cursor, Copilot, Cortex, OpenHands, Hermes and others). Use `npx graph-craft-skills --project` for `./.agents/skills/`, or `--target <dir>` for another store. `npx graph-craft-skills --list` prints the pack without installing.

## Skills in this pack

Read the skill that matches the job. Each one is self-contained and lives in its own folder.

| Source folder | Installed skill | Use it for |
|---|---|---|
| `skills/graph-craft-connect/` | `graph-craft-connect` | Endpoint, bearer key, scopes, discovery, first call, auth errors |
| `skills/graph-craft-read-graph/` | `graph-craft-read-graph` | Project info, graph lists, full graph loads, overview, node context, shortest paths |
| `skills/graph-craft-search-and-answer/` | `graph-craft-search-and-answer` | Fulltext search, `ask`, DQL, vector search, geo radius, time ranges |
| `skills/graph-craft-write-graph/` | `graph-craft-write-graph` | Append, update and delete nodes/edges; save, delete, duplicate graphs; vectors; project settings |
| `skills/graph-craft-drive-canvas/` | `graph-craft-drive-canvas` | Camera, selection, layout, paths, algorithms, styling, groups, notes, tabs, panels, export |
| `skills/graph-craft-collaborate-live/` | `graph-craft-collaborate-live` | SSE sync, live patches, dirty tabs, delivery rules, safe collaboration |
| `skills/graph-craft-recipes/` | `graph-craft-recipes` | End-to-end workflows: explore, answer, build, update, geo/time, live demo |
| `skills/graph-craft-troubleshoot/` | `graph-craft-troubleshoot` | 401/403, scope errors, rate limits, schema/index issues, missing canvas effects |

The installer copies each `skills/<name>/` folder into `~/.agents/skills/<name>/` (or the target you choose), so the installed names above are what the agent sees.

## Start here

1. Read the `graph-craft-connect` skill for the endpoint and key scopes.
2. Pick the skill for the job from the table above.
3. For a multi-step task, read `graph-craft-recipes` and follow the matching recipe.
4. If something fails, read `graph-craft-troubleshoot`.

## Mental model

```
project (API key) → Dgraph namespace → named graphs → nodes + edges
                                                   ↘ GvMeta (styles, groups, updated)
```

- A **graph** is a name such as `Investigation`. All nodes in it carry `gv.graph = "Investigation"`.
- A **node** is `type GvNode`: `gv.id`, `gv.label`, `gv.type`, `gv.props` (JSON string), `gv.style` (JSON), `gv.notes` (JSON), optional `gv.embedding` (vector), `gv.geo` (GeoJSON point), `gv.eventTime` (datetime).
- A **relationship** is a real Dgraph predicate `rel.<LABEL>` with facets `id`, `t` (original label) and `props` (JSON).
- `GvMeta` holds the graph's styles, groups, pins, collapsed state and `gv.updated` stamp.

IDs vs labels: most tools accept **either** a node id or a label (exact, then case-insensitive). Prefer ids when you have them.

## Core rules

- Prefer incremental tools (`nodes_append`, `edges_append`, `nodes_update`, `nodes_delete`, `edges_update`, `edges_delete`) over `graphs_save`.
- For a large graph, use `subgraph` (seed/search/type/rel, 1–3 hops, capped) or the canvas **Explore** panel instead of `graphs_load`.
- Never `graphs_save` a subset loaded with `subgraph`: edit it with the incremental write tools. The canvas Explore view auto-syncs only the changed nodes/edges; **Remove from canvas** is view-only and **Delete from graph** is a real delete.
- Reader keys read; editor keys write and drive the canvas.
- Canvas commands are **fire-and-forget**. If no board is open they are dropped. Data writes remain durable.
- A clean board merges live patches in place. A dirty board shows a **Load** notice and is never overwritten.
- One vector dimension per graph. Dgraph stores and indexes vectors; it does **not** embed text.
- Tool calls are rate limited per key (240/minute). Back off and retry on the error.
- Keep `dql_read` results small with `first:` and filters; the cap is 256 KB.
- Do not delete or rewrite a graph while the user is editing it.

## Not exposed over MCP

Project create/delete/duplicate, API keys, members, invitations, sign-out, the settings page and binary uploads stay in the web UI. PDF/CSV/RDF/Cypher export is not available; MCP exports PNG/SVG/JSON only.
