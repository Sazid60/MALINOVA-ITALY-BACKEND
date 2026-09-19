# Agent Instructions

<!-- lean-ctx -->
## lean-ctx

Prefer lean-ctx MCP tools over native equivalents for token savings:
`ctx_read` > Read/cat, `ctx_search` > Grep/rg, `ctx_shell` > bash, `ctx_tree` > ls/find.
Native Edit/Write/Glob stay as-is; use `ctx_edit` only when Edit needs an unavailable Read.
Full rules: LEAN-CTX.md (open on demand — do not auto-load).

### ctx_read Mode — Token Cost Impact

**ALWAYS omit `mode`** (= auto, 90-99% compression).  
`full` mode is 10-50x more expensive — use ONLY right before ctx_edit.

| Mode | Cost | When |
|------|------|------|
| omit/auto | 1x (cheapest) | Default for all reads |
| signatures | ~0.5x | API exploration |
| map | ~0.2x | Large files >500L |
| lines:N-M | ~0.3x | Known region |
| diff | ~0.3x | Post-edit check |
| full | 10-50x | **Only** before ctx_edit |
<!-- /lean-ctx -->
