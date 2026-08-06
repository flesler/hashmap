# hashmap

A small `HashMap` class for JavaScript — any key type, stable API since 2012, rewritten for 3.0.

Works in Node.js (14+) and the browser. ESM, CommonJS, TypeScript types, and an IIFE build included.

[![NPM](https://nodei.co/npm/hashmap.png?compact=true)](https://npmjs.org/package/hashmap)

```bash
npm install hashmap
```

```js
import HashMap from 'hashmap'
// or
const HashMap = require('hashmap')
```

---

## Why this exists

Native `Map` didn't exist when this library was created. It does now — and for most new code, **`Map` is the right default**.

`hashmap` is still worth reaching for when you need more than `Map` gives you:

| | `hashmap` | `Map` | `WeakMap` |
|---|---|---|---|
| Any key type (`null`, numbers, strings, objects, …) | yes | yes | objects only |
| Object keys by identity | yes | yes | yes |
| Iterate all entries / `.size` | yes | yes | no |
| Value-based equality for `Date`, `RegExp`, arrays | yes | no | no |
| Reverse lookup (`.search(value)`) | yes | no | no |
| Method chaining on mutators | yes | partial | no |

**Use `hashmap` when:**

- You need **custom key equality** — two `Date` objects with the same timestamp, two `/foo/` regexes, arrays compared element-wise.
- You need **`.search()`** — find the key for a value.
- You're maintaining **legacy code** that already depends on this API (plugin systems, protobuf registries, object-key pools, etc.).
- You want a **stable, zero-dependency** map that behaves the same in Node and the browser.

**Use native `Map` when:** string/number/symbol keys with `===` equality is enough. That's most apps.

**Use `WeakMap` when:** keys are objects and you want them garbage-collected when nothing else references them. You can't iterate a `WeakMap`.

---

## Quick start

```js
const map = new HashMap()

map.set('1', 'string one')
map.set(1, 'number one')
map.get('1') // 'string one'
map.get(1)   // 'number one'

const a = {}
const b = {}
map.set(a, 'first')
map.set(b, 'second')
map.get(a) // 'first' — object identity, not stringification
```

### Method chaining

```js
new HashMap()
  .set(1, 'one')
  .set(2, 'two')
  .forEach((value, key) => console.log(key, value))
```

### Iteration

```js
map.forEach((value, key) => { /* … */ })

for (const { key, value } of map) {
  console.log(key, value)
}
```

### Reverse lookup

```js
map.set('id', 42)
map.search(42) // 'id'
```

---

## API

### Constructor

- `new HashMap()` — empty map
- `new HashMap(other)` — copy from another `HashMap`
- `new HashMap([['k1', 'v1'], ['k2', 'v2']])` — from pairs array
- `new HashMap(k1, v1, k2, v2, …)` — from arguments

### Methods

| Method | Description |
|---|---|
| `get(key)` | Value for `key`, or `undefined` |
| `set(key, value)` | Store a pair (chainable) |
| `has(key)` | Whether `key` exists |
| `delete(key)` | Remove by key (chainable) |
| `search(value)` | Key for `value`, or `null` |
| `clear()` | Remove all entries (chainable) |
| `forEach(fn, ctx?)` | Iterate `(value, key)` (chainable) |
| `keys()` / `values()` / `entries()` | Arrays of keys, values, or `[key, value]` pairs |
| `clone()` | Shallow copy as a new `HashMap` |
| `copy(other)` | Copy entries from `other` into this map (chainable) |
| `multi(k1, v1, …)` | Set several pairs at once (chainable) |
| `size` | Number of entries |

Deprecated aliases kept for compatibility: `remove()` → `delete()`, `count()` → `size`, `type()`.

### TypeScript

Types ship with the package. Generics work as expected:

```ts
import HashMap from 'hashmap'

const cache = new HashMap<string, number>()
cache.set('answer', 42)
```

### Upgrading from 2.x / `@types/hashmap`

Types ship with the package since **3.0.0** — remove DefinitelyTyped:

```bash
npm uninstall @types/hashmap
```

`@types/hashmap` used `export = HashMap` (CommonJS assignment import). 3.0 uses a default export:

```ts
import HashMap from 'hashmap'
// import HashMap = require('hashmap')  // still works in TS with esModuleInterop
```

`hash()` was removed (internal helper, no known dependents). Deprecated `remove()`, `count()`, and `type()` remain. See [docs/backwards-compatibility.md](docs/backwards-compatibility.md).

---

## Browser

For a script tag without a bundler, use the IIFE build:

```html
<script src="node_modules/hashmap/dist/hashmap.iife.js"></script>
<script>
  const map = new HashMap()
  map.set(document.body, 'root')
</script>
```

---

## Benchmarks

3.0 rewrote the internals (numeric hashing, flat entry storage, eager `Map` index, cached entry hashes). Measured on Node 24, ~250 ms per benchmark, string keys unless noted. Run locally:

```bash
npm run benchmark
npm run benchmark -- -o tmp/current.json --compare tmp/benchmark-baseline.json
```

### vs 2.4.0

| Operation | 2.4.0 | 3.0.0 | Change |
|---|---:|---:|---:|
| `set` | 226K | 266K | **1.2×** |
| `get` | 224K | 298K | **1.3×** |
| `has` | 237K | 268K | **1.1×** |
| `delete` | 210K | 264K | **1.3×** |
| `set` (replace existing key) | 7K | 193K | **26×** |
| `get` (map with 1024 entries) | 10K | 273K | **27×** |
| `forEach` (1024 entries) | 29K | 1.7M | **60×** |
| `keys` (1024 entries) | 26K | 722K | **28×** |
| `clone` (1024 entries) | 11K | 19K | **1.7×** |
| `copy` (1024 entries) | 12K | 19K | **1.6×** |
| `set` after `delete` (1024 entries) | 238K | 91K | 0.4× |

**Summary:** 18 of 20 benchmarks faster than 2.4.0. Biggest wins: replacing/updating keys, iteration, and clone/copy. Remaining gaps: burst inserts into an empty map and delete-then-set on large maps.

Values are ops/sec (higher is better). Native `Map` is faster on plain `get` with string keys — `hashmap` trades that for custom equality, `.search()`, and the legacy API.

---

## Development

```bash
npm test        # types + unit tests
npm run build   # dist (esm, cjs, iife, dts)
npm run lint
```

## License

[MIT](LICENSE) © [Ariel Flesler](https://github.com/flesler)
