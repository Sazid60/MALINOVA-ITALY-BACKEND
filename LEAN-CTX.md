<!-- lean-ctx-owned: PROJECT-LEAN-CTX.md v2 -->
# lean-ctx — Context Engineering Layer
<!-- lean-ctx-rules-v12 -->

## Tool Mapping (MANDATORY — use instead of native equivalents)

| Instead of | Use | Example |
|------------|-----|---------|
| Read/cat/head/tail | `ctx_read(path)` | `ctx_read("src/main.rs")` (omit mode = auto) |
| Grep/rg/find | `ctx_search(pattern, path)` | `ctx_search("fn handle", "src/")` |
| Shell/bash | `ctx_shell(command)` | `ctx_shell("cargo test")` |
| Edit (when Read unavailable) | `ctx_edit(path, old, new)` | `ctx_edit("f.rs", "old", "new")` |

## CRITICAL: ctx_read Mode = Your Biggest Token Lever

**Always omit `mode`** — defaults to `auto` which compresses 90-99%.  
`full` mode sends the ENTIRE file raw — use ONLY right before `ctx_edit`.

| Goal | Mode | When |
|------|------|------|
| **Everything unless editing** | **omit (auto)** | Default — 90-99% compression |
| Understand API | `signatures` | Even lighter than auto |
| Large file overview | `map` | >500 lines, won't edit |
| Specific region | `lines:N-M` | Know exact location |
| Re-read after edit | `diff` | Post-edit verification |
| Edit this file | `full` | **Only** right before ctx_edit |

## Workflow (follow this order)

1. **Orient:** `ctx_overview(task)` or `ctx_compose(task, path)` for unfamiliar tasks
2. **Locate:** `ctx_search(pattern, path)` for exact text; `ctx_semantic_search(query)` for concepts
3. **Read:** `ctx_read(path, mode)` with appropriate mode from table above
4. **Edit:** `ctx_edit(path, old_string, new_string)` or native Edit if available
5. **Verify:** `ctx_read(path, "diff")` + `ctx_shell("test command")`
6. **Record:** `ctx_knowledge(action="remember", content="...")` for non-obvious findings

## Proactive (use without being asked)

- `ctx_overview(task)` — at session start for orientation
- `ctx_compress` — when context grows large (at phase boundaries)
- `ctx_knowledge(action="wakeup")` — at session start to surface prior findings

## Compression Bypass (only when compressed output hides needed detail)

`ctx_read(path, "lines:N-M")` → `ctx_read(path, "full")` → `ctx_shell(cmd, raw=true)`
Return to compressed defaults after one expanded retrieval.

## Risk Gate (before high-impact edits)

Before editing exported symbols, auth, DB schemas, or 3+ files: run `ctx_impact(action="analyze")`
and `ctx_callgraph(action="callers")` to confirm blast radius.

## Session

- **Start:** `ctx_session(action="status")` + `ctx_knowledge(action="wakeup")`
- **End:** `ctx_session(action="decision", content="what was done + next steps")`
- **On [CHECKPOINT]:** `ctx_session(action="task", value="current status")`

NEVER use native Read/Grep/Shell when ctx_* equivalents are available.
<!-- /lean-ctx -->
