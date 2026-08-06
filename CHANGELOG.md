# Changelog

## 3.0.0

### Breaking changes
- TypeScript source, published from `dist/` (ESM + CJS + IIFE + types)
- Dropped bower support
- Minimum Node.js 14

### Fixed
- `clone()` and constructor/`copy()` clone no longer share `Entry` objects with the source (2.4 semantics)

### Changed
- Object-key identity uses a module-level `WeakMap` instead of `_hmuid_` expando on user objects
- Internal hash index uses native `Map` instead of a plain object

### Deprecated (kept for compatibility)
- `count()` — use `.size`
- `remove()` — use `.delete()`
- `hash()` and `type()` — legacy helpers, not used internally

### Performance
- Numeric internal hashing with flat entry storage
- Faster mutations, iteration, and lookups vs 2.4.0 (see `npm run benchmark`)

### Tooling
- Vitest, ESLint 9, tsup, GitHub Actions CI

## 2.4.0
- HashMap instances are now compatible ES6 iterators. Thanks @NathanJang

## 2.3.0
- Constructor now supports a 2D array 2D of key-value pair. Thanks @ulikoehler
- Renamed `remove()` to `delete()`. `remove()` is now deprecated and kept temporarily. Thanks @ulikoehler
- Added `.size` member. `count()` is now deprecated and kept temporarily. Thanks @ulikoehler

## 2.2.0
- Added entries() method to hashmaps. Thanks @ulikoehler

## 2.1.0
- support ECMA 5 non-conformant behaviour of Microsoft edge #27. Thanks @freddiecoleman

## 2.0.6
- Names of chained methods is hardcoded rather than using the "return" trick. Fixes bug when minified, thanks @fresheneesz.
- Added jshint to be run before any commit

## 2.0.5
- count() is now O(1), thanks @qbolec

## 2.0.4
- hasOwnProperty() is used to check for the internal expando, thanks @psionski

## 2.0.3
- forEach method accepts a context as 2nd argument, thanks @mvayngrib

## 2.0.2
- Make collisions rarer

## 2.0.1
- AMD CommonJS export is now compatible

## 2.0.0
- Added chaining to all methods with no returned value
- Added multi() method
- Added clone() method
- Added copy() method
- constructor accepts one argument for cloning or several for multi()

## 1.2.0
- Added search() method, thanks @rafalwrzeszcz

## 1.1.0
- AMD support, thanks @khrome

## 1.0.1
- forEach() callback receives the hashmap as `this`
- Added keys()
- Added values()

## 1.0.0
- First release
