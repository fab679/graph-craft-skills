---
name: graph-craft-collaborate-live
description: Work alongside a person on a live graph-craft board — SSE sync, live patches, dirty-tab notices, command delivery and safe collaboration rules.
---

# Collaborate live

Data writes are durable in Dgraph. Canvas commands are live and best-effort. The board and the agent see the same graph.

## How the board receives changes

- `GET /api/graphs/stream?projectId=...` is an SSE stream (session auth). It polls the project namespace every 2 seconds and emits `graphs` only when a graph name or `gv.updated` stamp changes.
- A 30-second `/api/graphs/stamps` poll is the fallback.
- Writes from MCP, another tab or a direct Dgraph client all flow through the same stamps. The stream is not MCP-specific.
- Canvas commands arrive on the same stream through the Postgres `gc_canvas` channel.

## Clean tab vs dirty tab

- **Clean tab**: an incremental write publishes a `patch`; the board merges the new nodes, edges and property changes in place. No full reload, no layout reset.
- **Dirty tab**: the board shows a “changed in the saved graph” notice with a **Load** button. Local unsaved work is never clobbered.
- `graphs_save` replaces the graph wholesale; the board shows a notice rather than silently reloading.
- Canvas-only changes (styles, groups, notes, pins, tabs, view filters, positions) live in the board document. The user must **Save** to persist them.

## Safe collaboration

1. Prefer incremental tools (`nodes_append`, `edges_append`, `nodes_update`, `nodes_delete`, `edges_update`, `edges_delete`) over `graphs_save`.
2. Check `graphs_list` stamps before a large rewrite. If the user is editing, do not delete or replace the graph.
3. Use `canvas_command` for visual feedback: `focus`, `select`, `path`, `group_create`, `style_node`, `note_add`.
4. Keep commands small and observable. A dropped command is not an error; the data is still safe.
5. After a write, tell the user what changed and whether they need to **Save** canvas-only state.
6. Reader keys for analysis agents; short-lived editor keys for writers.

## What is not live

- Canvas commands have no acknowledgement channel. If you need proof a command landed, ask the user or follow with a read.
- There is no presence indicator and no command queue. A command sent before the board opens is dropped.
- There is no automatic merge of local canvas edits with remote data changes; the dirty-tab notice is the safety valve.
