---
name: graph-craft-recipes
description: End-to-end graph-craft workflows — explore, answer a question, build a graph from scratch, update data, attach vectors, use geo/time, and run a live canvas demo.
---

# Recipes

Each recipe assumes a working MCP connection and a project key. Tool calls use the JSON-RPC `tools/call` envelope.

## 1. Explore before answering

```jsonc
{"name":"project_info","arguments":{}}
{"name":"graphs_list","arguments":{}}
{"name":"graph_overview","arguments":{"graph":"Investigation"}}
```

Use `graph_overview` for “how many”, “which types”, “what are the hubs”. Load the full graph only when you need it.

## 1b. Explore a large graph without loading it all

Start from a node, a search, or a schema pattern:

```jsonc
{"name":"subgraph","arguments":{"graph":"Investigation","search":"Elena Marsh","depth":2,"limit":200}}

{"name":"subgraph","arguments":{"graph":"Investigation","type":"Person","rel":"DRIVES","targetType":"Vehicle","depth":1,"limit":200}}

// expand selected nodes by one hop
{"name":"subgraph","arguments":{"graph":"Investigation","nodes":["Elena Marsh","Warehouse 7"],"depth":1,"limit":100}}

// property filter
{"name":"subgraph","arguments":{"graph":"Investigation","type":"Person","prop":"role","propValue":"Warehouse","depth":1}}

// expand and auto-link to nodes already on the canvas
{"name":"subgraph","arguments":{"graph":"Investigation","nodes":["Elena Marsh"],"linkTo":["Jeremy Bowers","Vehicle Envoy"],"depth":1}}

// arbitrary pattern, any length; empty node/rel = (any)
{"name":"subgraph","arguments":{"graph":"Investigation","pattern":[{"kind":"node","type":"Person"},{"kind":"rel"},{"kind":"node"},{"kind":"rel","label":"INVOLVED_IN"},{"kind":"node","type":"Crime"}]}}
```

`subgraph` returns a normal graph-craft document plus `truncated` (cap hit),
`moreAvailable` (unexpanded neighbours remain) and optional `linkEdges` back
to the `linkTo` nodes. The canvas **Explore** panel exposes the same flow
without DQL: a search-first pattern builder of any length (type + `TAB` or
click a suggestion row), right-click **Expand neighbours**, and automatic
cross-links. The panel also owns the perspective picker: choosing a perspective
there loads it. In the web app a saved graph is a **perspective**, with its own
data. Incoming edges use `@reverse`; a graph saved before the reverse schema
needs one save first.

Editing that subset? Use the incremental tools on the same graph name —
`nodes_append`, `edges_append`, `nodes_update`, `nodes_delete`, `edges_delete`,
`edges_update`. Do not `graphs_save` the subset; that would replace the whole
graph. On the canvas, edits auto-sync the diff, **Remove from canvas** is
view-only, and **Delete from graph** removes the record.

## 2. Answer a question

```jsonc
{"name":"ask","arguments":{
  "graph":"Investigation",
  "question":"How does Elena Marsh connect to Jeremy Bowers?"
}}
```

`ask` returns matched nodes, properties, one-hop neighbours and connecting edges. Read the evidence, then answer. For an exact route call `find_path`. For counts and types call `graph_overview`. For custom structure call `dql_read`.

## 3. Build a graph from scratch

```jsonc
{"name":"nodes_append","arguments":{"graph":"demo","nodes":[
  {"label":"Alice","type":"Person","properties":{"role":"Analyst"}},
  {"label":"Bob","type":"Person"}
]}}
// returns { ids: ["mcp-...-0", "mcp-...-1"] }

{"name":"edges_append","arguments":{"graph":"demo","edges":[
  {"source":"mcp-...-0","target":"mcp-...-1","label":"KNOWS"}
]}}
```

Both calls are incremental. Each publishes a live patch to a clean board. The graph is created on the first append.

## 4. Update one thing

```jsonc
{"name":"nodes_update","arguments":{"graph":"demo","updates":[
  {"id":"mcp-...-0","properties":{"role":"Lead Analyst","since":"2026"}}
]}}
```

`properties` replaces that node's property JSON. Read the node first for a partial update. Geo/time refresh automatically.

## 5. Change a relationship

```jsonc
{"name":"edges_update","arguments":{"graph":"demo","updates":[
  {"source":"Alice","target":"Bob","label":"KNOWS","newLabel":"MET","properties":{"since":"2026"}}
]}}
```

Use `"reverse": true` to flip direction. A live patch removes the old edge and adds the new one.

## 6. Attach vectors

Dgraph stores and indexes vectors; it does not embed text. Compute vectors in your model first.

```jsonc
{"name":"vectors_set","arguments":{"graph":"demo","vectors":[
  {"id":"mcp-...-0","vector":[0.12,-0.03,0.88]}
]}}
{"name":"vector_search","arguments":{"graph":"demo","vector":[0.12,-0.03,0.88],"k":10}}
```

All vectors in one graph must share a dimension.

## 7. Geo and time

Geo comes from `lat`/`lng` (or `latitude`/`longitude`) properties. Time comes from the first date-like property (`date`, `datetime`, `timestamp`, `time`, `when`, `occurred`, `created`, `updated`, `start`, `end`).

```jsonc
{"name":"geo_near","arguments":{"graph":"Investigation","lat":42.3601,"lng":-71.0589,"radiusMeters":2000}}
{"name":"time_range","arguments":{"graph":"Investigation","from":"2026-04-18T00:00:00Z","to":"2026-04-19T00:00:00Z"}}
```

Dgraph uses WGS84 `[longitude, latitude]` and `@index(year)` for datetime range scans.

## 8. Run a live canvas demo

```jsonc
{"name":"canvas_command","arguments":{"action":"fit"}}
{"name":"canvas_command","arguments":{"action":"focus","node":"Elena Marsh"}}
{"name":"canvas_command","arguments":{"action":"path","from":"Elena Marsh","to":"Jeremy Bowers","pathMode":"shortest"}}
{"name":"canvas_command","arguments":{"action":"group_create","nodes":["Elena Marsh","Warehouse 7"],"groupName":"Warehouse lead","groupColor":"#6366f1"}}
{"name":"canvas_command","arguments":{"action":"style_node","nodes":["Elena Marsh"],"color":"#e11d48"}}
{"name":"canvas_command","arguments":{"action":"note_add","node":"Elena Marsh","note":"Verify CCTV 7-C"}}
```

Canvas commands are best-effort. If no board is open they are dropped; the data remains safe.

## 9. Duplicate or delete a graph

```jsonc
{"name":"graphs_duplicate","arguments":{"source":"Investigation","target":"Investigation copy"}}
{"name":"graphs_delete","arguments":{"graph":"Investigation copy"}}
```

Deleting a graph clears an open board showing it. Do not delete while the user is editing.

## 10. Import or migrate a whole graph

```jsonc
{"name":"graphs_save","arguments":{"graph":"Investigation","doc":{ /* full graph document */ }}}
```

Use `graphs_save` only for imports and migrations. It replaces the graph wholesale and the board shows a notice. For normal edits use the incremental tools.

## 11. Answer with a path

```jsonc
{"name":"find_path","arguments":{"graph":"Investigation","from":"Elena Marsh","to":"Jeremy Bowers","directed":true}}
```

Then highlight it on the board:

```jsonc
{"name":"canvas_command","arguments":{"action":"path","from":"Elena Marsh","to":"Jeremy Bowers","pathMode":"shortest","directed":true}}
```
