---
name: graph-craft-read-graph
description: Read a graph-craft project — project info, graph lists, full graph loads, overview counts, one node with neighbours, and shortest paths.
---

# Read a graph

Use this skill before writing or answering. Start broad, then narrow.

## Tools

| Tool | Arguments | Use it for |
|---|---|---|
| `project_info` | `{}` | Project id, name, stored graphs |
| `graphs_list` | `{}` | Graph names and `updated` stamps |
| `graphs_load` | `{"graph":"<name>"}` | Whole graph as JSON: nodes, edges, styles, groups, notes, embeddings |
| `graph_overview` | `{"graph":"<name>"}` | Counts by node/relationship type, embedding coverage, top hubs |
| `node_context` | `{"graph":"<name>","node":"<id or label>","hops":1}` | One node, properties, 1–2 hop neighbours and edges |
| `find_path` | `{"graph":"<name>","from":"<id or label>","to":"<id or label>"}` | Shortest path between two nodes |

`node` and the path endpoints accept a node id **or** a label (exact, then case-insensitive).

## Order of operations

1. `project_info` — confirm the project.
2. `graphs_list` — pick the graph name. Names are exact and case-sensitive.
3. `graph_overview` — understand scale and types before loading everything.
4. `graphs_load` — only when you need the full document. Large graphs can be heavy.
5. `node_context` — inspect one node and its neighbourhood.
6. `find_path` — prove a route. Undirected by default; pass `"directed": true` to respect edge direction.

## Examples

```jsonc
{"name":"graphs_list","arguments":{}}

{"name":"graph_overview","arguments":{"graph":"Investigation"}}

{"name":"node_context","arguments":{"graph":"Investigation","node":"Elena Marsh","hops":2}}

{"name":"find_path","arguments":{"graph":"Investigation","from":"Elena Marsh","to":"Jeremy Bowers"}}
```

## Reading the result

- Nodes carry `id`, `label`, `type`, `properties`, optional `style`, `notes`, `embedding`.
- Edges carry `id`, `source`, `target`, `label`, optional `properties`.
- Prefer ids from the result when you later write. Labels work but can be ambiguous.
- `graphs_load` is a snapshot. A live board may have unsaved local changes; see `graph-craft-collaborate-live`.
