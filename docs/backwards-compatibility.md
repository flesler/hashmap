# Backwards compatibility (2.4.0 → 3.0.0)

Audit date: 2026-08-06. Reference: [hashmap 3.0.0](https://github.com/flesler/hashmap/releases/tag/3.0.0).

## Import patterns

| Pattern | 2.4.0 | 3.0.0 | Notes |
|---|---|---|---|
| `const HashMap = require('hashmap')` | ✅ | ✅ | CJS patch makes export the constructor |
| `require('hashmap').HashMap` | ✅ | ✅ | Same function as default export |
| `import HashMap from 'hashmap'` | ⚠️ | ✅ | ESM default; 2.4 was CJS-only publish |
| `import { HashMap } from 'hashmap'` | ❌ | ✅ | Named export added in 3.0 |
| `import * as NS from 'hashmap'; new NS.default()` | — | ✅ | Bare namespace is not constructible |
| `<script>` / IIFE `new HashMap()` | ✅ | ✅ | `dist/hashmap.iife.js` |
| `require('hashmap/index.js')` | ✅ | ❌ | Use package root; `exports` field blocks deep paths |

## API

| API | 2.4.0 | 3.0.0 | Notes |
|---|---|---|---|
| `remove()` | deprecated | ✅ alias of `delete()` | Kept |
| `count()` | deprecated | ✅ alias of `size` | Kept |
| `type()` | ✅ | ✅ deprecated | Kept |
| `hash()` | ✅ | ❌ removed | No known dependents |
| `size` | ✅ | ✅ | Preferred over `count()` |
| Object keys by identity | `_hmuid_` expando | `WeakMap` side table | No property added to user objects |
| `clone()` / `copy()` entry isolation | shared `Entry` refs (bug) | deep-copied entries | Matches documented 2.4 intent |

## TypeScript / `@types/hashmap`

| | `@types/hashmap@2.3.4` | `hashmap@3.0.0` bundled |
|---|---|---|
| Module shape | `export = HashMap` | `export default` + `export { HashMap }` |
| Generics | `HashMap<TKey, TValue>` | `HashMap` with `unknown` keys/values (use inference at call sites) |
| `hash()` | present | removed |
| `size` | not in DT types | `size: number` |
| `count()` | primary in DT | deprecated |

**Migration:** `npm uninstall @types/hashmap`. Types ship with the package since 3.0.0.

```ts
// Before (@types/hashmap)
import HashMap = require('hashmap')
const map = new HashMap<string, number>()

// After (bundled types)
import HashMap from 'hashmap'
const map = new HashMap<string, number>()  // still works; keys/values are typed at use sites
```

## Smoke tests (built artifact)

Run after `npm run build`:

```bash
node -e "const H=require('./dist/hashmap.cjs'); console.assert(typeof H==='function'&&H===H.HashMap)"
node -e "const {HashMap}=require('./dist/hashmap.cjs'); console.assert(typeof HashMap==='function')"
node --input-type=module -e "import H,{HashMap as N} from './dist/hashmap.js'; console.assert(H===N)"
```

Encoded in `src/hashmap.test.ts` → `package import interop`.

## Dependent audit commands

```bash
gh search code "require('hashmap')" --limit 50
gh search code "from 'hashmap'" --limit 50
npm view hashmap version
npm view @types/hashmap version
```
