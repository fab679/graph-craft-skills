---
name: graph-craft-search-and-answer
description: Search and answer questions from a graph-craft graph — Dgraph fulltext search, ask evidence bundles, read-only DQL, HNSW vectors, geo radius and time ranges.
---

# Search and answer

Search and question-answering run **in Dgraph**, not in the MCP process.

- `gv.label` carries `term`, `trigram` and `fulltext` indexes.
- `gv.props` (the node's property JSON) carries a `fulltext` index.
- `gv.embedding` is a `float32vector` with an HNSW `cosine` index.
- `gv.geo` is `geo @index(geo)` and `gv.eventTime` is `datetime @index(year)`.

`search` and `ask` use `anyoftext(...)` / `alloftext(...)`, so tokenising, stemming and stopword removal happen in Dgraph. The JS scan is only a fallback for namespaces whose schema predates the fulltext index; the next save adds it.

## Tools

### `search`

```jsonc
{"name":"search","arguments":{"graph":"Investigation","query":"Elena Marsh"}}
{"name":"search","arguments":{"graph":"Investigation","query":"type:Person","limit":20}}
{"name":"search","arguments":{"graph":"Investigation","query":"label:CCTV"}}
{"name":"search","arguments":{"graph":"Investigation","query":"role:driver"}}
```

- Fulltext over labels and properties.
- `key:value` narrows a property; `type:` narrows a node type; `label:` narrows the label.
- Returns matching nodes; use `limit` to keep results small.

### `ask`

```jsonc
{"name":"ask","arguments":{
  "graph":"Investigation",
  "question":"How does Elena Marsh connect to Jeremy Bowers?"
}}
```

Returns an **evidence bundle**: matched nodes, their properties, one-hop neighbours and connecting edges. The calling agent composes the answer. Pass `"vector":[...]` to seed with HNSW similarity instead of fulltext.

### `dql_read`

Read-only DQL in the project namespace. The escape hatch for structural questions (group-by counts, `shortest()`, variable blocks). Results are capped at 256 KB.

```jsonc
{"name":"dql_read","arguments":{"query":"{ q(func: eq(gv.graph, \"Investigation\")) @filter(type(GvNode)) { count(uid) } }"}}
```

Keep it small with `first:` and filters.

### `vector_search`

```jsonc
{"name":"vector_search","arguments":{"graph":"Investigation","vector":[0.12,-0.03,0.88],"k":10}}
```

Nearest nodes by HNSW cosine similarity over `gv.embedding`.

### `geo_near`

```jsonc
{"name":"geo_near","arguments":{"graph":"Investigation","lat":42.3601,"lng":-71.0589,"radiusMeters":2000}}
```

Nodes within a radius of a point. Dgraph uses WGS84 `[longitude, latitude]`.

### `time_range`

```jsonc
{"name":"time_range","arguments":{"graph":"Investigation","from":"2026-04-18T00:00:00Z","to":"2026-04-19T00:00:00Z"}}
```

Nodes whose `gv.eventTime` falls between two ISO datetimes.

## How geo and time are derived

- **Geo** comes from a node's `lat`/`lng` (or `latitude`/`longitude`) properties, stored as a GeoJSON point in `gv.geo`.
- **Time** comes from the first date-like property: `date`, `datetime`, `timestamp`, `time`, `when`, `occurred`, `created`, `updated`, `start`, `end`, stored in `gv.eventTime`.
- Both refresh on `graphs_save`, `nodes_append` and `nodes_update` when properties change. Existing rows fill in on their next write.

## Answering well

1. `graph_overview` for counts and types.
2. `search` or `ask` for the evidence.
3. `find_path` when the question is “how are these connected”.
4. `dql_read` only when the shape is structural and the tools above cannot express it.
5. Cite node labels and properties from the evidence. Do not invent nodes or metrics.
6. If the evidence is thin, say so and name the search terms you tried.

## Vectors

Dgraph stores and indexes vectors; it does **not** embed text. Supply vectors from your embedding model with `vectors_set` (see `graph-craft-write-graph`) or pass a query vector to `vector_search` / `ask`. Every vector in a graph must share one dimension.
