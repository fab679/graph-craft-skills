---
name: graph-craft-connect
description: Connect an MCP client to a graph-craft project — endpoint, bearer key, reader/editor scopes, discovery, first calls and auth errors.
---

# Connect to graph-craft

## Endpoint

```
POST http://localhost:3100/mcp
Authorization: Bearer gc_...
Content-Type: application/json
Accept: application/json, text/event-stream
```

- Deployed instances use their HTTPS origin and the `/mcp` path. TLS terminates at the edge.
- `GET /healthz` answers without auth and is useful for a liveness check.
- Browser origins outside `MCP_ALLOWED_ORIGINS` get **403**. Non-browser clients send no `Origin` and pass.
- Keys are minted in the web UI: **Projects → open a project → Settings → API keys → New key**.
- `reader` keys read, search and ask. `editor` keys also write and drive the canvas.
- Verification is per request against Postgres. Revoking a key kills its next request; expired keys fail closed.

## Discover the tools

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

The server exposes **25 tools**. Call one:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{
  "name":"project_info",
  "arguments":{}
}}
```

## First check

1. `project_info` with `{}` — confirms the key resolves to a project.
2. `graphs_list` with `{}` — shows the named graphs.
3. `graph_overview` with `{"graph":"<name>"}` — counts by type, embedding coverage and hubs.

If those work, the connection is healthy and you can use any skill in the pack.

## Curl

```bash
curl -s http://localhost:3100/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer gc_...' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Rules

- Never put the key in a query string or a log line.
- The project is fixed by the key. Tools never accept a project id argument.
- Use a reader key for analysis agents; mint a short-lived editor key for writers.
- On 401, mint a fresh key. On 403, check the client `Origin` against `MCP_ALLOWED_ORIGINS`.
