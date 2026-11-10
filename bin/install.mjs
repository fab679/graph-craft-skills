#!/usr/bin/env node
/**
 * graph-craft-skills installer.
 *
 * Copies the main SKILL.md and every labelled sub-skill folder into a skills
 * directory. No dependencies, so `npx graph-craft-skills` works offline.
 */
import { cp, mkdir, readdir, readFile, symlink } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"));

const DEFAULT_TARGET = join(homedir(), ".agents", "skills");

/** Global agent directories that read skills from their own folder. */
const AGENT_LINKS = [
  { parent: ".claude", dir: ".claude/skills" },
  { parent: ".codex", dir: ".codex/skills" },
  { parent: ".pi", dir: ".pi/agent/skills" },
  { parent: ".hermes", dir: ".hermes/skills" },
  { parent: ".openhands", dir: ".openhands/skills" },
  { parent: ".gemini", dir: ".gemini/config/skills" },
  { parent: ".gemini", dir: ".gemini/skills" },
  { parent: ".gemini/antigravity-cli", dir: ".gemini/antigravity-cli/skills" },
  { parent: ".gemini/antigravity", dir: ".gemini/antigravity/skills" },
  { parent: ".config/opencode", dir: ".config/opencode/skills" },
  { parent: ".config/agents", dir: ".config/agents/skills" },
  { parent: ".snowflake", dir: ".snowflake/cortex/skills" },
  { parent: ".copilot", dir: ".copilot/skills" },
  { parent: ".cursor", dir: ".cursor/skills" },
  { parent: ".kilo", dir: ".kilo/skills" },
  { parent: ".factory", dir: ".factory/skills" },
  { parent: ".aider-desk", dir: ".aider-desk/skills" },
  { parent: ".continue", dir: ".continue/skills" },
  { parent: ".codeium", dir: ".codeium/windsurf/skills" },
  { parent: ".config/crush", dir: ".config/crush/skills" },
  { parent: ".kiro", dir: ".kiro/skills" },
  { parent: ".roo", dir: ".roo/skills" },
  { parent: ".zencoder", dir: ".zencoder/skills" },
  { parent: ".qwen", dir: ".qwen/skills" },
  { parent: ".openclaw", dir: ".openclaw/skills" },
];

/** Project-level directories with a different path from `.agents/skills`. */
const PROJECT_LINKS = [
  { dir: ".claude/skills" },
  { dir: ".openhands/skills" },
  { dir: ".hermes/skills" },
];

const HELP = `graph-craft-skills ${pkg.version} — install graph-craft agent skills

Usage:
  npx graph-craft-skills [install] [options]
  npx graph-craft-skills list

Options:
  --project        install into ./.agents/skills and link project agents
  --target <dir>   install into a custom skills directory
  --link-agents    link into detected agent directories (default on)
  --no-link        do not create agent symlinks
  --force, -f      overwrite existing skill folders
  --dry-run        show what would be copied
  --list           list the skills without installing
  --help, -h       show this help
  --version, -v    print the version

Default target: ~/.agents/skills (the shared global store). The installer
symlinks each skill into the agent directories it detects.`;

function fail(message) {
  console.error(`graph-craft-skills: ${message}\n`);
  console.error(HELP);
  process.exit(1);
}

function expandHome(path) {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return resolve(path);
}

function parseArgs(argv) {
  const opts = {
    mode: "install",
    target: DEFAULT_TARGET,
    project: false,
    force: false,
    dryRun: false,
    linkAgents: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "install" || arg === "add") continue;
    if (arg === "list" || arg === "--list") {
      opts.mode = "list";
      continue;
    }
    if (arg === "--project") {
      opts.project = true;
      opts.target = resolve(process.cwd(), ".agents", "skills");
      continue;
    }
    if (arg === "--link-agents") {
      opts.linkAgents = true;
      continue;
    }
    if (arg === "--no-link") {
      opts.linkAgents = false;
      continue;
    }
    if (arg === "--target") {
      const value = argv[++i];
      if (!value) fail("--target needs a directory");
      opts.target = expandHome(value);
      continue;
    }
    if (arg === "--force" || arg === "-f") {
      opts.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      opts.mode = "help";
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      opts.mode = "version";
      continue;
    }
    fail(`unknown option: ${arg}`);
  }
  return opts;
}

async function readMeta(file) {
  const text = await readFile(file, "utf8");
  const block = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = {};
  if (!block) return meta;
  for (const line of block[1].split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) meta[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return meta;
}

function safeName(name) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
    fail(`invalid skill name "${name}" (use kebab-case)`);
  }
  return name;
}

async function discover() {
  const skillsDir = join(PACKAGE_ROOT, "skills");
  if (!existsSync(skillsDir)) fail("skills/ is missing from the package");

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skills = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const file = join(skillsDir, entry.name, "SKILL.md");
    if (!existsSync(file)) continue;
    const meta = await readMeta(file);
    skills.push({
      name: meta.name || entry.name,
      description: meta.description || "",
      folder: `skills/${entry.name}`,
      source: join(skillsDir, entry.name),
      root: meta.name === "graph-craft" || entry.name === "graph-craft",
    });
  }
  if (!skills.length) fail("no skills found under skills/");

  skills.sort((a, b) => (a.root ? -1 : b.root ? 1 : a.folder.localeCompare(b.folder)));
  return skills;
}

function list(skills) {
  console.log(`\n${pkg.name} ${pkg.version} — ${skills.length} skills\n`);
  for (const skill of skills) {
    console.log(skill.name);
    console.log(`  folder: ${skill.folder}/`);
    if (skill.description) console.log(`  ${skill.description}`);
    console.log();
  }
}

async function linkIntoAgents(skills, opts) {
  const links = opts.project ? PROJECT_LINKS : AGENT_LINKS;
  const linked = [];
  for (const link of links) {
    if (!opts.project && !existsSync(join(homedir(), link.parent))) continue;
    const dir = opts.project ? resolve(process.cwd(), link.dir) : join(homedir(), link.dir);
    if (!opts.dryRun) await mkdir(dir, { recursive: true });
    for (const skill of skills) {
      const dest = join(dir, skill.name);
      if (existsSync(dest)) continue;
      if (opts.dryRun) {
        linked.push(dest);
        continue;
      }
      const rel = relative(dir, join(opts.target, skill.name));
      await symlink(rel, dest);
      linked.push(dest);
    }
  }
  return linked;
}

async function install(skills, opts) {
  if (!opts.dryRun) await mkdir(opts.target, { recursive: true });

  const installed = [];
  const skipped = [];

  for (const skill of skills) {
    const dest = join(opts.target, safeName(skill.name));
    if (existsSync(dest) && !opts.force) {
      skipped.push(skill);
      continue;
    }
    if (!opts.dryRun) {
      await cp(skill.source, dest, { recursive: true, force: true });
    }
    installed.push(skill);
  }

  const linked = opts.linkAgents ? await linkIntoAgents(skills, opts) : [];

  console.log(`\n${pkg.name} ${pkg.version}`);
  if (opts.dryRun) console.log("Dry run — no files written.");
  console.log(`Target: ${opts.target}\n`);

  for (const skill of installed) {
    console.log(`  ${opts.dryRun ? "would install" : "installed"}  ${skill.name}${skill.root ? "  (main)" : ""}`);
  }
  for (const skill of skipped) {
    console.log(`  skipped        ${skill.name}  (exists; use --force)`);
  }

  console.log(
    `\n${installed.length} ${opts.dryRun ? "would be " : ""}installed` +
      (skipped.length ? `, ${skipped.length} skipped` : "") +
      ".",
  );
  if (linked.length) {
    console.log(
      `Linked ${linked.length} ${opts.dryRun ? "would-be " : ""}agent ${linked.length === 1 ? "entry" : "entries"} into detected directories.`,
    );
  }
  if (!opts.dryRun) console.log("Restart your agent or reload skills so it picks up the pack.");
}

const opts = parseArgs(process.argv.slice(2));
if (opts.linkAgents === null) opts.linkAgents = opts.target === DEFAULT_TARGET || opts.project;
if (opts.mode === "help") {
  console.log(HELP);
  process.exit(0);
}
if (opts.mode === "version") {
  console.log(pkg.version);
  process.exit(0);
}

const skills = await discover();
if (opts.mode === "list") {
  list(skills);
  process.exit(0);
}
await install(skills, opts);
