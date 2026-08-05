# hashmap roadmap

**3.0.0** — one major release, shipped in staged commits. Tooling first, API cleanup second, performance last.

---

## Context

### What this library is

A small `HashMap` class for JavaScript (Node + browser) that maps **arbitrary keys** (objects, arrays, dates, `null`, etc.) to values using **value equality**, not reference equality like native `Map`.

### PR #48 review (Feb 2021)

[PR #48](https://github.com/flesler/hashmap/pull/48) proposed a trie-based rewrite with faster mutations. We benchmarked it locally (Node 24) and reverted the merge.

**PR wins (mutations):**

| Benchmark | ~change vs 2.4.0 |
|---|---|
| `singleSet` / `get` / `has` / `delete` | 2–3× faster |
| `singleReplace` / `getAfter1024` | ~40× faster |
| `setAfter1024` / `setAfter131072` | 1.2–1.9× faster |

**PR losses:**

| Benchmark | ~change vs 2.4.0 |
|---|---|
| `create` | ~2× slower |
| `forEach` / `keys` / `values` / `entries` | ~10× slower |
| `clone` / `copy` | ~7× slower |

**Why:** PR #48 fixed the real bottleneck (string hash allocation on every op) but paid for it with a heavy trie structure, sparse-array iteration, and `copy`/`clone` that re-insert every entry.

**Decision:** do not merge as-is. Use benchmarks to guide a custom implementation that wins everywhere.

### Current repo state

- **Version:** 2.4.0 on npm; **3.0.0** is the active development target
- **Done:**
  - Expanded test suite (58 tests)
  - `bin/benchmark.js` — JSON harness with `-o` and `--compare`
  - Baseline captured at `tmp/benchmark-baseline.json`
- **Uncommitted:** `bin/benchmark.js` `--compare` (working tree)

---

## Version strategy

No 2.5.0. Everything lands as **3.0.0** — developed in ordered commits, published once the full arc is done.

```
2.4.0  (released, frozen)
  │
  ▼
3.0.0  (in progress — staged commits, single release)
  │
  ├─ Stage 1: tooling + TS port (behavior unchanged)
  ├─ Stage 2: API cleanup (breaking removals)
  └─ Stage 3: performance (benchmark-driven, go hard)
```

| Stage | Breaking? | Ships when |
|---|---|---|
| **1 — Tooling** | Build/layout only | `dist/` replaces root `hashmap.js`; API identical |
| **2 — Cleanup** | Yes | Deprecated methods removed, bower gone |
| **3 — Perf** | No (internals) | Faster across the board; benchmark-gated |

3.0.0 is a **major bump**. Document migration in CHANGELOG. Users on `^2.4.0` are not auto-upgraded.

---

## Target layout (end state)

```
hashmap/
├── src/
│   ├── hashmap.ts
│   └── hashmap.test.ts
├── bin/
│   └── benchmark.ts
├── dist/                     # published, gitignored
│   ├── hashmap.js            # ESM
│   ├── hashmap.cjs           # CJS
│   ├── hashmap.d.ts
│   └── hashmap.umd.js        # browser
├── docs/
│   └── roadmap.md
├── eslint.config.js
├── vitest.config.ts
├── tsup.config.ts
├── tsconfig.json
├── tsconfig.build.json
├── tsconfig.test.json
├── .nvmrc                    # v24
└── .github/workflows/ci.yml
```

### Tooling

| Tool | Choice |
|---|---|
| Node | **24** (`.nvmrc` + `engines`) |
| Language | **TypeScript** (`strict: true`) |
| Build | **tsup** — ESM + CJS + `.d.ts` + UMD |
| Tests | **Vitest** — `src/**/*.test.ts` |
| Lint | **ESLint 9** flat config, `@stylistic`, no semis, single quotes |
| Typecheck | `tsc -p tsconfig.test.json --noEmit` |
| CI | GitHub Actions — test, build, lint on PR |

### Style

- No semicolons, single quotes, 2-space indent
- Tests co-located with source

---

## Stage 1 — Tooling & TypeScript port

**Goal:** modern dev stack, zero behavior change. Version in `package.json` → `3.0.0` from the first commit.

### Commits (in order)

1. **Scaffold** — `.nvmrc`, eslint, vitest, tsup, tsconfigs, CI, update `.gitignore`
2. **Port source** — `hashmap.js` → `src/hashmap.ts` (mechanical, minimal types)
3. **Port tests** — `test/test.js` → `src/hashmap.test.ts` (vitest, drop chai)
4. **Wire package** — `exports` map, `prepublishOnly`, remove mocha/jshint/husky 0.14
5. **Benchmark** — commit `bin/benchmark.js --compare`, port to TS if needed
6. **Docs** — update Readme install/import for `dist/`

### Gate

- All 58 tests pass (vitest)
- `npm run build` produces working CJS + ESM + types
- `npm run lint` clean
- CI green
- Benchmark matches 2.4.0 baseline (no perf work yet — should be ~same)

### What stays

- Full public API including deprecated `count()`, `remove()`, `hash()`, `type()`
- UMD/browser support via tsup
- `HashMap.HashMap` CJS compat

---

## Stage 2 — API cleanup

**Goal:** remove dead weight. Breaking changes are intentional — this is 3.0.0.

### Remove

| Item | Notes |
|---|---|
| `count()` | use `.size` |
| `remove()` | use `.delete()` |
| `hash()` | internal only; was public for debugging, not needed |
| `type()` | internal only |
| `bower.json` | bower is dead |
| AMD `define()` | drop unless there's demand |
| Root `hashmap.js` | only `dist/` ships |

### Keep

`get`, `set`, `has`, `delete`, `multi`, `copy`, `clone`, `clear`, `search`, `forEach`, `keys`, `values`, `entries`, `size`, ES6 iterator, constructor overloads.

### Commits

1. Remove deprecated methods + update tests
2. Remove bower, AMD, old tooling artifacts
3. Update Readme + CHANGELOG migration section

### Gate

- Tests updated, no deprecated API references
- CHANGELOG documents every break

---

## Stage 3 — Performance

**Goal:** maximally fast. Benchmark every change. Beat 2.4.0 on **all** ops — no PR #48-style tradeoffs.

### Known bottleneck (2.4.0)

String hash allocation on every `get`/`set`/`has`/`delete`:

- `'♠' + key` for strings
- Recursive join for arrays
- Type detection + concat for primitives

### Approach

Numeric internal hash + equality on the hot path. Flat entry storage for fast iteration/clone/create:

```
Internal:
  _entries: Entry[]              // dense, fast forEach/keys/clone
  _index:   Map<number, Slot>    // fast lookup
  Slot = Entry | Entry[]         // collision chain only when needed

  fastHash(key)   → number
  keyEquals(a, b) → current semantics (NaN, arrays, dates, regex, objects)

No trie. No string alloc on hot path. Shallow clone copies _entries + _index.
```

### Perf commits (iterative)

Each commit: one focused change + benchmark run.

1. `fastHash` + `keyEquals` internals (no wire-up yet)
2. Wire `get`/`set`/`has`/`delete` through index
3. Optimize `copy`/`clone` (structural share or memcpy, not re-insert)
4. Optimize `search` if needed
5. Micro-opts: reduce allocations in constructor, `multi`, `clear`
6. Re-benchmark vs baseline AND vs PR #48 numbers — publish results in CHANGELOG

### Benchmark gate

```bash
node bin/benchmark.js -o tmp/current.json --compare tmp/benchmark-baseline.json
```

**Must pass on every perf commit:**

| Category | Requirement |
|---|---|
| Mutations (`set`, `get`, `has`, `delete`) | faster than 2.4.0 |
| `singleReplace`, `getAfter1024` | much faster than 2.4.0 |
| Iteration (`forEach`, `keys`, `values`, `entries`) | **not slower** than 2.4.0 |
| `clone`, `copy`, `create` | **not slower** than 2.4.0 |

If a change wins mutations but loses iteration — reject it, try another approach.

### What we are not doing

| Item | Reason |
|---|---|
| Merge PR #48 trie | Iteration/clone/create regressions |
| Native `Map` as storage | Changes equality semantics for arrays/objects |
| Ship perf before tooling | Can't measure or bisect without harness + TS |
| Keep deprecated API | 3.0.0 is the line in the sand |

---

## Benchmark harness

```bash
node bin/benchmark.js -o ./tmp/benchmark.json
node bin/benchmark.js -o ./tmp/current.json --compare ./tmp/benchmark-baseline.json
```

| Category | Benchmarks |
|---|---|
| Core mutations | `create`, `singleSet`, `singleSet20`, `singleReplace` |
| Lookups | `singleGet`, `has`, `delete`, `search`, `getAfter1024` |
| Warm map writes | `setAfter1024`, `set20After1024`, `setAfter131072`, `set20After131072` |
| Iteration | `forEach1024`, `keys1024`, `values1024`, `entries1024` |
| Copy | `clone1024`, `copy1024`, `clear1024` |
| Object keys | `objectKeySet` |

---

## Release checklist (3.0.0)

- [ ] Stage 1 complete — tooling green
- [ ] Stage 2 complete — deprecated API removed, migration docs written
- [ ] Stage 3 complete — benchmarks beat 2.4.0 across the board
- [ ] `CHANGELOG.md` — breaking changes + perf numbers
- [ ] Readme updated
- [ ] `npm publish` (major)
- [ ] GitHub release with benchmark comparison table

---

## Immediate next steps

1. Bump `package.json` version to `3.0.0`
2. Commit `bin/benchmark.js` `--compare` + `docs/roadmap.md`
3. Stage 1, commit 1: scaffold tooling (`.nvmrc`, eslint, vitest, tsup, tsconfigs, CI)
