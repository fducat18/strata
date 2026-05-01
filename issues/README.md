# Issues

A lightweight, in-tree tracker for **deferred work** — things consciously left
out of the current scope, recorded here so they aren't forgotten and can be
handed to a future planning session as input.

This folder is **not** a replacement for GitHub Issues. It exists so:

- A planning session can read these files as concrete starting context.
- Anyone reading the repo (including future-you) can see what's known to be
  incomplete without having to dig through git history or external trackers.
- Each entry is self-contained: rationale, current limitation, acceptance
  criteria, references. A future agent can act on a single file with no other
  context needed.

## Format

Each issue is its own `.md` file with this skeleton:

```markdown
# <Short title>

## Why this is deferred
…

## Current limitation
…

## Acceptance criteria
- [ ] …
- [ ] …

## References
- file:line
- doc: link
```

Filenames use kebab-case, e.g. `bundle-node-runtime.md`.
