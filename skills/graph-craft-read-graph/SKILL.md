---
name: graph-craft-read-graph
description: Read a graph-craft project — project info, graph lists, full or partial graph loads, overview counts, one node with neighbours, and shortest paths.
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
| `subgraph` | `{"graph":"<name>","seed"\|"search"\|"type"\|"nodes":…,"depth":1,"limit":200}` | Load only a seed/search/pattern neighbourhood. Returns a graph-craft document plus `truncated` and `moreAvailable` |
| `node_context` | `{"graph":"<name>","node":"<id or label>","hops":1}` | One node, properties, 1–2 hop neighbours and edges |
| `find_path` | `{"graph":"<name>","from":"<id or label>","to":"<id or label>"}` | Shortest path between two nodes |

`node` and the path endpoints accept a node id **or** a label (exact, then case-insensitive).

## Order of operations

1. `project_info` — confirm the project.
2. `graphs_list` — pick the graph name. Names are exact and case-sensitive.
3. `graph_overview` — understand scale and types before loading everything.
4. `subgraph` — for a large graph, load a seed, search or type/relationship pattern instead of everything. Expand selected node ids with another call.
5. `graphs_load` — only when you need the full document. Large graphs can be heavy.
6. `node_context` — inspect one node and its neighbourhood.
7. `find_path` — prove a route. Undirected by default; pass `"directed": true` to respect edge direction.

## Examples

```jsonc
{"name":"graphs_list","arguments":{}}

{"name":"graph_overview","arguments":{"graph":"Investigation"}}

{"name":"subgraph","arguments":{"graph":"Investigation","search":"Elena Marsh","depth":2,"limit":200}}

{"name":"subgraph","arguments":{"graph":"Investigation","type":"Person","rel":"DRIVES","targetType":"Vehicle","depth":1}}

{"name":"node_context","arguments":{"graph":"Investigation","node":"Elena Marsh","hops":2}}

{"name":"find_path","arguments":{"graph":"Investigation","from":"Elena Marsh","to":"Jeremy Bowers"}}
```

## Reading the result

- Nodes carry `id`, `label`, `type`, `properties`, optional `style`, `notes`, `embedding`.
- Edges carry `id`, `source`, `target`, `label`, optional `properties`.
- Prefer ids from the result when you later write. Labels work but can be ambiguous.
- `graphs_load` is a snapshot. A live board may have unsaved local changes; see `graph-craft-collaborate-live`.
- `subgraph` returns a normal graph-craft document. `truncated` means the cap was hit; `moreAvailable` means unexpanded neighbours remain. Pass `nodes` to expand a selection by one hop.
- A partial load is **not** a saved graph. Edit it with the incremental write tools (`nodes_append`, `edges_append`, `nodes_update`, `nodes_delete`, `edges_delete`, `edges_update`) against the same graph name; never `graphs_save` a subset. The canvas Explore view does this automatically: it diffs edits against the loaded subset and writes only those changes. **Remove from canvas** is view-only; **Delete from graph** removes the record.
