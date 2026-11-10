# graph-craft-skills

Agent skills for graph-craft: one main `SKILL.md` plus one skill per job.

- **Public repository:** https://github.com/fab679/graph-craft-skills
- **User guide:** https://app.20.97.254.218.sslip.io/docs/agent-integration

## Install

### Recommended: the Skills CLI

```bash
npx skills add fab679/graph-craft-skills
```

Installs every skill into the agents it detects. Install one skill, or globally:

```bash
npx skills add fab679/graph-craft-skills --skill graph-craft-write-graph
npx skills add fab679/graph-craft-skills -g
```

### Direct installer

```bash
npx graph-craft-skills
```

By default the direct installer puts the pack in **`~/.agents/skills/`**, the shared global store used by Codex, Pi, Cline, Cursor, Gemini CLI and others:

```
~/.agents/skills/
  graph-craft/SKILL.md
  graph-craft-connect/SKILL.md
  graph-craft-read-graph/SKILL.md
  graph-craft-search-and-answer/SKILL.md
  graph-craft-write-graph/SKILL.md
  graph-craft-drive-canvas/SKILL.md
  graph-craft-collaborate-live/SKILL.md
  graph-craft-recipes/SKILL.md
  graph-craft-troubleshoot/SKILL.md
```

It then symlinks each skill into the agent directories it detects: Claude Code, Codex, OpenCode, Gemini CLI, Antigravity, Cursor, GitHub Copilot, Cortex, OpenHands, Hermes, Kilo, Droid, Windsurf, Amp/Universal and the other agents that keep their own skills folder.

Options:

```bash
npx graph-craft-skills --project          # ./.agents/skills + project agent links
npx graph-craft-skills --target <dir>     # install into another store
npx graph-craft-skills --link-agents      # force links into detected agent dirs
npx graph-craft-skills --no-link          # install only; no symlinks
npx graph-craft-skills --list             # list the pack without installing
npx graph-craft-skills --force            # overwrite existing skill folders
npx graph-craft-skills --dry-run          # show what would be copied
```

The `--project` mode installs into `./.agents/skills/` and links into `./.claude/skills/`, `./.openhands/skills/` and `./.hermes/skills/`.

## Set up the MCP connection

The skills assume your MCP client already points at a graph-craft project. Five steps.

If you already have a hosted graph-craft instance, skip to step 2 and use your
deployment's `/mcp` URL.

### 1. Start the server locally

From the graph-craft repo:

```bash
# backends: Dgraph + Postgres
docker compose up -d alpha postgres

# host-side env, then web + MCP together
set -a; . ./.env; set +a
pnpm dev
```

- Web: `http://localhost:3000`
- MCP: `http://localhost:3100/mcp`
- Health: `GET http://localhost:3100/healthz` (no auth)

For a deployed instance, use your HTTPS origin and the `/mcp` path. TLS terminates at the edge.

### 2. Mint a project key

In the web app: **Projects → open a project → Settings → API keys → New key**.

- `reader` — read, search, ask, paths, geo/time
- `editor` — everything above, plus writes and canvas commands
- Keys are project-bound and verified on every request. Revoking a key kills its next request.

### 3. Point your client at `/mcp`

Claude Code, project `.mcp.json`:

```json
{
  "mcpServers": {
    "graph-craft": {
      "type": "http",
      "url": "http://localhost:3100/mcp",
      "headers": { "Authorization": "Bearer gc_REPLACE_ME" }
    }
  }
}
```

Or add it from the CLI:

```bash
claude mcp add --transport http graph-craft http://localhost:3100/mcp \
  --header "Authorization: Bearer gc_REPLACE_ME"
```

Cursor, `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "graph-craft": {
      "url": "http://localhost:3100/mcp",
      "headers": { "Authorization": "Bearer gc_REPLACE_ME" }
    }
  }
}
```

Windsurf, `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "graph-craft": {
      "serverUrl": "http://localhost:3100/mcp",
      "headers": { "Authorization": "Bearer gc_REPLACE_ME" }
    }
  }
}
```

MCP inspector:

```bash
npx @modelcontextprotocol/inspector --transport http \
  --server-url http://localhost:3100/mcp \
  --header "Authorization: Bearer gc_REPLACE_ME"
```

### 4. Verify the connection

```bash
curl -s http://localhost:3100/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Authorization: Bearer gc_REPLACE_ME' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

You should see 24 tools. Then call `project_info` with `{}` and `graphs_list` with `{}`.

### 5. Install the skills

```bash
npx graph-craft-skills
```

Restart the agent (or reload skills) so it picks up the new `SKILL.md` files. The main `graph-craft` skill routes to the rest.

### Connection troubleshooting

| Symptom | Fix |
|---|---|
| 401 | Key missing, expired or revoked; mint a fresh key |
| 403 | Browser `Origin` not in `MCP_ALLOWED_ORIGINS`; non-browser clients send no `Origin` and pass |
| Connection refused | MCP server not running; `pnpm dev` starts web :3000 and MCP :3100 |
| `tools/list` empty | Wrong URL; it must end in `/mcp`, not the web origin |
| Dgraph errors | Backends not up or `.env` not exported; check `/healthz` and compose logs |

## The pack

| Folder | Skill | Purpose |
|---|---|---|
| `skills/graph-craft-connect/` | `graph-craft-connect` | Endpoint, bearer key, scopes, discovery, first call |
| `skills/graph-craft-read-graph/` | `graph-craft-read-graph` | Project info, graph lists, full loads, overview, node context, paths |
| `skills/graph-craft-search-and-answer/` | `graph-craft-search-and-answer` | Fulltext search, `ask`, DQL, vectors, geo, time |
| `skills/graph-craft-write-graph/` | `graph-craft-write-graph` | Incremental node/edge writes, graph save/delete/duplicate, vectors |
| `skills/graph-craft-drive-canvas/` | `graph-craft-drive-canvas` | Camera, selection, layout, paths, algorithms, styling, groups, notes, tabs, export |
| `skills/graph-craft-collaborate-live/` | `graph-craft-collaborate-live` | SSE sync, live patches, dirty tabs, delivery rules |
| `skills/graph-craft-recipes/` | `graph-craft-recipes` | End-to-end workflows |
| `skills/graph-craft-troubleshoot/` | `graph-craft-troubleshoot` | Auth, scope, rate-limit, schema and canvas failures |

The main [`skills/graph-craft/SKILL.md`](skills/graph-craft/SKILL.md) is the
router: it explains the mental model, the core rules and which skill to read
next.

## Requirements

- **Skills CLI:** Node.js 22.20 or newer.
- **Direct installer:** Node.js 18 or newer.
- A graph-craft project and an API key (`reader` or `editor` scope), minted in the web UI under project settings → API keys.
- An MCP client that speaks Streamable HTTP with a static bearer token.

## Publish

The package is publish-ready. From the repository root:

```bash
npm publish --access public
```

After publishing, `npx graph-craft-skills` works for anyone; the public GitHub
repo also makes `npx skills add fab679/graph-craft-skills` work. Until then,
run it locally:

```bash
node bin/install.mjs --list
node bin/install.mjs --target /tmp/skills-test
```
