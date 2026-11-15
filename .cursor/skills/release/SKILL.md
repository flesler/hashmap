---
name: release
description: Read before cutting an npm release for hashmap on GitHub and npm.
---

## Division of labor

| Who | Does |
| --- | --- |
| **Agent** | Product commits on `main`, `npm run lint:full`, version bump commit (+ changelog), annotated tag, GitHub release, `git push origin main` and tag in one push. |
| **User** | `npm publish` only (npm 2FA). |

- **Never** `npm publish` in the agent — user publishes to npm only.
- On `/release` (or an explicit release request): run the full agent checklist; do not stop after the bump commit and wait for the user to tag or push.
- Do not chain `git push` and `npm publish` in one command (user publishes separately).

## Commit format (this repo)

Read `git log -15 --oneline` before writing subjects. On `main` lately:

- Imperative sentence, capitalized, period optional: `Add Husky pre-commit hook mirroring CI checks.`
- Conventional prefix when it fits: `fix: …`, `docs: …` (not required for every commit).
- Optional body paragraph after a blank line when the why is not obvious (see `0efa0ca`).

### Version commit

After product work is on `main`, one **version-only** commit (no library source changes unless `.nvmrc` / release tooling must move with the tag). Commit subject is **exactly the semver**, e.g. `3.0.2` — not `Bump to …`, not `Release …`.

Include in that commit:

- `package.json` `version`
- `package-lock.json` (root `version` and `packages[""].version`)
- `CHANGELOG.md` section for `X.Y.Z`
- Release/agent glue when it changed for this ship (e.g. `.cursor/skills/`, `.agents`)

```bash
npm version patch|minor|major --no-git-tag-version
# or: npm version X.Y.Z --no-git-tag-version --allow-same-version
```

Do not mix product features, fixes, or unrelated docs into the version commit.

## Changelog format (this repo)

File: `CHANGELOG.md` — title `# Changelog`, **no release dates**, **no** `## [x.y.z]` brackets.

**3.x (current style)** — new section at the top:

```markdown
## X.Y.Z

### Fixed
- …

### Changed
- …
```

Use headings that match the release: `### Breaking changes`, `### Deprecated (kept for compatibility)`, `### Performance`, `### Tooling`, `### TypeScript`, etc. (see `3.0.0`).

**2.x and older** used a flat bullet list under `## X.Y.Z`; new releases stay on the 3.x grouped style.

Credit issues or reporters in bullets when relevant (`Thanks @…` still fine for external contributions).

## Ready to ship?

```bash
source ~/.nvm/nvm.sh && nvm use
npm run lint:full
```

`lint:full` = pre-commit gate (`lint:fix`, `test:types`, `build`, `test:unit`) — same as CI except CI runs `lint` not `lint:fix`.

```bash
npm view hashmap version
jq -r .version package.json
```

Ship when `lint:full` is green, the new `CHANGELOG` section matches the diff since the **previous release tag**, and only the bump commit (if any) is pending.

Published package is **`dist/`** only (`files` in `package.json`; `prepublishOnly` runs `build` on publish).

Default **patch** for bugfixes; ask for **minor** / **major** when the diff is ambiguous.

## Tags and GitHub release (agent)

Tags are **bare semver** (`3.0.2`), not `v3.0.2` — matches `3.0.0`, `2.4.0`, and [GitHub release `3.0.0`](https://github.com/flesler/hashmap/releases/tag/3.0.0). (`v3.0.1` exists locally; new tags use the bare form.)

NEVER run bare `git tag` (opens an editor):

```bash
VERSION=3.0.2
git tag -a "${VERSION}" -m "${VERSION}"
git push origin main "${VERSION}"
```

One push for branch + tag.

Create the GitHub release on that tag (tags alone are not enough). **`--title` is already the version** — notes must **not** repeat `## X.Y.Z` (body starts at `### Fixed`, etc.):

```bash
VERSION=3.0.2
mkdir -p "/tmp/hashmap-release-notes"
awk -v ver="${VERSION}" '
  $0 == "## " ver { body=1; next }
  body && /^## / { exit }
  body { print }
' CHANGELOG.md > "/tmp/hashmap-release-notes/${VERSION}.md"
gh release create "${VERSION}" --title "${VERSION}" --notes-file "/tmp/hashmap-release-notes/${VERSION}.md"
```

Use `--latest` when backfilling older releases. To fix an existing release: `gh release edit "${VERSION}" --notes-file "…"`.

## Publish (user only)

```bash
npm publish
```

Confirm:

```bash
npm view hashmap version
```

## Checklist (agent)

1. Product commits on `main` (code, tests, docs — not version/changelog unless bump commit).
2. `npm run lint:full` green.
3. Version commit: `package.json`, `package-lock.json`, `CHANGELOG.md` (+ release skill if needed) — subject `X.Y.Z`.
4. `git tag -a X.Y.Z -m X.Y.Z` → `git push origin main X.Y.Z`.
5. `gh release create X.Y.Z` with notes = that CHANGELOG section **without** the `## X.Y.Z` line.
6. Tell the user to `npm publish` when git is on the tag they expect.

## Checklist (user)

1. `npm publish` for `hashmap`.
2. `npm view hashmap version`.