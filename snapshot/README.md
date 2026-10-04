# snapshot/

Working artifacts for review: screenshots, DOM dumps, probe output, contact sheets.

Create, read, delete. Nothing in here is source. `.gitignore` enforces that — `git status` must
never show a file from this directory.

**Why it exists:** review artifacts have to land somewhere predictable so a subagent (e.g.
`duyan-runtime-verifier`, `duyan-vision-reader`) and the main agent can point at the same file
without polluting the repo root or scattering temp paths across Windows.

**Rules:**

- Screenshots go here, named `snapshot/{route}-{width}-{theme}.png`.
- Read them, act on them, delete them — never leave a capture behind (a stray artifact is how a
  repo root rots; the sibling projects both shipped zips and PSDs this way).
- If a capture is worth keeping for more than one session, move it into `.claude/drafts/` with
  the date in the name and a one-line note on why it matters.
- If the machine is disposing of `snapshot/` itself, that is fine — everything in it is
  reproducible.