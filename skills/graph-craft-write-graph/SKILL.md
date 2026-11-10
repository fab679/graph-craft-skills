---
name: graph-craft-write-graph
description: Write a graph-craft graph — append, update and delete nodes and edges incrementally, save/delete/duplicate graphs, attach vectors and change project settings.
---

# Write a graph

Writes need an **editor** key. Prefer incremental tools over `graphs_save`; Dgraph updates individual predicates and the open board receives a live patch.

## Editing a partial load

If you loaded a subset with `subgraph`, edit it with the incremental tools against
the **same graph name**. Never `graphs_save` a partial document: that would replace
the graph with only the loaded nodes. The canvas Explore view follows the same
rule — it diffs edits against the loaded subset and syncs only those changes.
Removing a node from the canvas is view-only; deleting it from the graph is a real
`nodes_delete`.

## Nodes and edges

### Append nodes

```jsonc
{"name":"nodes_append","arguments":{"graph":"demo","nodes":[
  {"label":"Alice","type":"Person","properties":{"role":"Analyst"}},
  {"label":"Bob","type":"Person"}
]}}
```

- Up to 500 per call. Creates the graph when missing. Returns the new node ids.
- Each node accepts `label`, `type` and `properties`. Use `vectors_set` for embeddings; style/notes are canvas-side.

### Append edges

```jsonc
{"name":"edges_append","arguments":{"graph":"demo","edges":[
  {"source":"<node id>","target":"<node id>","label":"KNOWS","properties":{"since":"2026"}}
]}}
```

- Up to 500 per call. Both endpoints must already exist.
- `source` and `target` accept ids or labels.

### Update nodes

```jsonc
{"name":"nodes_update","arguments":{"graph":"demo","updates":[
  {"id":"<node id>","label":"Alice Chen","type":"Person","properties":{"role":"Lead Analyst"}}
]}}
```

- Pass an id **or** a label as the `id` field. Only the fields you send are written (`gv.label`, `gv.type`, `gv.props`, `gv.embedding`).
- `properties` **replaces** that node's property JSON. Read the node first if you need a partial update.
- Geo/time refresh from `lat`/`lng` and the first date-like property.

### Delete nodes

```jsonc
{"name":"nodes_delete","arguments":{"graph":"demo","ids":["<node id>","Bob"]}}
```

Deletes the nodes and their edges. Accepts ids or labels.

### Update an edge

```jsonc
{"name":"edges_update","arguments":{"graph":"demo","updates":[
  {"source":"Alice","target":"Bob","label":"KNOWS","newLabel":"MET","properties":{"since":"2026"}}
]}}
```

- Change the label, direction (`"reverse": true`) and/or properties in place.
- The old edge is removed and the new one added; a live patch follows.

### Delete an edge

```jsonc
{"name":"edges_delete","arguments":{"graph":"demo","edges":[
  {"source":"Alice","target":"Bob","label":"KNOWS"}
]}}
```

Deletes the specific relationship. Endpoints accept ids or labels.

## Whole-graph operations

| Tool | Use it for |
|---|---|
| `graphs_save` | Replace one graph wholesale — imports and migrations only; the board shows a notice |
| `graphs_delete` | Delete a named graph; open boards showing it clear |
| `graphs_duplicate` | Copy a graph to another name in the same project |

```jsonc
{"name":"graphs_duplicate","arguments":{"source":"Investigation","target":"Investigation copy"}}
{"name":"graphs_delete","arguments":{"graph":"Investigation copy"}}
```

## Vectors and settings

```jsonc
{"name":"vectors_set","arguments":{"graph":"demo","vectors":[
  {"id":"<node id>","vector":[0.12,-0.03,0.88]}
]}}
```

All vectors in one graph must share a dimension. Dgraph stores and indexes them; it does not embed text.

```jsonc
{"name":"project_settings","arguments":{"captionProp":"name","paletteSeed":0,"defaultLayout":"force"}}
```

Open boards update live.

## Rules

- Read before you update: `properties` is a full replacement.
- Prefer ids from `nodes_append`; use exact labels when you do not have ids.
- Do not rewrite or delete a graph while the user is editing it. A dirty tab gets a notice, but the data change is already durable.
- One vector dimension per graph.
- Incremental writes publish a live patch. Canvas-only changes still need the user to **Save**.
