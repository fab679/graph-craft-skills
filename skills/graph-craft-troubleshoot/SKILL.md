---
name: graph-craft-troubleshoot
description: Diagnose graph-craft MCP failures — 401/403, reader vs editor scope, rate limits, schema/index errors, empty graph loads and canvas commands that do nothing.
---

# Troubleshoot

## Quick diagnostics

1. `project_info` with `{}` — does the key resolve to a project?
2. `graphs_list` with `{}` — is the graph name exactly right?
3. `graph_overview` with `{"graph":"<name>"}` — does the graph have data?
4. `search` with a known label — does fulltext work?
5. For canvas issues, confirm a board is open on the same graph.

## Error table

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 | Key missing, expired or revoked | Mint a fresh key in project settings |
| 403 | Browser `Origin` not in `MCP_ALLOWED_ORIGINS` | Use a non-browser client or add the origin |
| `scope 'reader' cannot write` | Reader key used for a write | Use an editor key |
| 429 / rate limit | More than 240 tool calls per minute | Back off and retry |
| Empty `graphs_load` after a save | Namespace schema/index missing | Write once (`nodes_update` or `graphs_save`) to run `ensureSchema` |
| `Predicate gv.geo is not indexed` | Old schema | Save or update once |
| `Predicate gv.eventTime is not indexed` | Old schema | Save or update once |
| Unknown endpoint for an edge | Endpoint id or label not found | `node_context` or `graphs_list`, then use the exact id |
| Vector dimension error | Mixed dimensions in one graph | Re-embed with one model/dimension |
| Canvas command no effect | No board open, wrong graph, or node not in the open doc | Open the graph, then retry |
| Path does not highlight | Endpoint labels differ or the tab is dirty | Load the graph, hard-reload once, retry |
| Group command misses | Group name differs | Pass the exact group name or id |
| `dql_read` truncated | Result over 256 KB | Add `first:` and filters |

## Schema and indexes

The app calls `ensureSchema` on writes. A namespace created before the geo/datetime/fulltext indexes may need one write before those tools work. `graphs_save`, `nodes_append` or `nodes_update` is enough.

## Keys

- Verification is per request. Revoking a key kills the next request.
- If a key may have leaked, revoke it, rotate `BETTER_AUTH_SECRET`, and mint a fresh key.
- Reader keys cannot write. Editor keys can read and write.

## Canvas

- Commands are fire-and-forget and dropped if no board is open.
- There is no acknowledgement channel. If you need proof, ask the user or follow with a read.
- A dirty tab shows a **Load** notice instead of applying a remote change. The user must choose.
- Canvas-only state (styles, groups, notes, pins, tabs, view filters, positions) is saved only when the user presses **Save**.

## When to stop and ask

- The graph name is ambiguous or missing.
- A write would delete or replace data the user is editing.
- The evidence for an answer is thin or contradictory.
- A command has been sent twice with no visible effect and no board is confirmed open.
