# Agent: migrate a dependent from hashmap 2.x to 3.x

For Cursor agents (or humans) opening upgrade PRs on downstream repos.

**Upstream references:**

- [backwards-compatibility.md](./backwards-compatibility.md) — full API/import matrix
- [CHANGELOG.md](../CHANGELOG.md) — breaking changes
- [README upgrading section](../README.md#upgrading-from-2x--typeshashmap)

**npm:** `hashmap@^3.0.1` (types bundled; uninstall `@types/hashmap`)

---

## Preconditions

- Work only in a **fresh clone under `/tmp`** (e.g. `/tmp/zeditor`).
- Use **local project installs** (`npm ci` / `npm install` in the repo). **Do not** install packages globally (`npm install -g`, `npx` without project context, etc.). If the only path forward requires global tooling, **stop, report, and abort**.
- Skip repos with **no commits in ~2+ years** or clearly abandoned (e.g. volumio/Volumio2).

---

## Decision tree (run first)

```bash
cd /tmp/<repo>
rg -n "hashmap|@types/hashmap" package.json package-lock.json yarn.lock pnpm-lock.yaml 2>/dev/null
rg -n "require\(['\"]hashmap|from ['\"]hashmap|@types/hashmap" --glob '!node_modules'
rg -n "\.hash\(" --glob '!node_modules'          # removed in 3.0
rg -n "hashmap/" --glob '!node_modules'          # deep imports broken in 3.0
```

| Finding | Action |
|---------|--------|
| Only `require('hashmap')` in `.js` files | Bump `package.json` only |
| `@types/hashmap` in deps | Remove it; types ship with `hashmap@3` |
| `import HashMap = require('hashmap')` or ESM imports | Switch to `import HashMap from 'hashmap'` (see backwards-compat) |
| `.hash(` calls | Remove or replace (API removed; no known real users) |
| `require('hashmap/...')` deep paths | Change to `require('hashmap')` |
| No hashmap usage found | Abort — wrong repo or transitive-only dep |

---

## Checklist

- [ ] Clone target repo to `/tmp/<name>`
- [ ] Create branch, e.g. `chore/bump-hashmap-3`
- [ ] Set `hashmap` to `^3.0.1` in `package.json` (or bump lockfile via install in repo only)
- [ ] Remove `@types/hashmap` if present
- [ ] Apply source edits only if grep found patterns above (most repos: **no source edits**)
- [ ] Run project gates: `npm test`, `npm run lint`, or whatever the repo's CI uses (read `package.json` scripts / `.github/workflows`)
- [ ] If gates fail and fix is unclear, stop and report
- [ ] Open PR with title like `chore: bump hashmap to 3.x`
- [ ] PR body: link https://github.com/flesler/hashmap/blob/main/docs/backwards-compatibility.md, note CJS `require()` unchanged for typical usage

---

## PR body template

```markdown
## Summary
Bump `hashmap` from 2.x to `^3.0.1`.

For this repo's usage (`require('hashmap')`), no source changes were required. hashmap 3.x is backwards compatible for typical CJS usage and includes bundled TypeScript types.

Migration reference: https://github.com/flesler/hashmap/blob/main/docs/backwards-compatibility.md

## Test plan
- [ ] CI passes
- [ ] (manual) smoke test any feature that uses HashMap if applicable
```

---

## Good first targets

Active repos with direct `require('hashmap')` and old pins — verify `pushed_at` on GitHub before investing time:

- `Automattic/zeditor` — pinned `2.0.1`, single `require` in `lib/editor/index.js`

Skip dormant repos (last push years ago).

---

## Do not

- Postinstall scripts or runtime warnings in hashmap itself (maintainer concern, not dependent PR)
- Force major bump via dependency tricks
- Open PRs on archived repos without maintainer interest
