import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import { describe, it, expect, beforeEach } from 'vitest'
import HashMap from './hashmap.js'

const distDir = join(dirname(fileURLToPath(import.meta.url)), '../dist')
const distCjs = join(distDir, 'hashmap.cjs')
const distEsm = join(distDir, 'hashmap.js')
const distIife = join(distDir, 'hashmap.iife.js')
const distEsmUrl = pathToFileURL(distEsm).href
const hasDist = existsSync(distCjs) && existsSync(distEsm) && existsSync(distIife)

let hashmap: HashMap

describe('hashmap', () => {
  beforeEach(() => {
    hashmap = new HashMap()
  })

  describe('hashmap.type()', () => {
    function check(data: unknown, type: string) {
      expect(hashmap.type(data)).toBe(type)
    }

    it('should detect types accurately', () => {
      check(null, 'null')
      check(undefined, 'undefined')
      check(true, 'boolean')
      check(false, 'boolean')
      check(NaN, 'number')
      check(1, 'number')
      check(1.1, 'number')
      check('1.1', 'string')
      check('Test', 'string')
      check(/test/, 'regexp')
      check(new Date(), 'date')
      check([], 'array')
      check({}, 'object')
      check(HashMap, 'function')
      check(hashmap, 'object')
    })

    it('should cast type for browsers that don\'t conform to ECMA 5 spec', () => {
      const originalToString = Object.prototype.toString
      let type = 'DOMWindow'

      Object.prototype.toString = function () {
        return '[object ' + type + ']'
      }

      check(null, 'null')
      check(undefined, 'undefined')

      type = 'Window'
      check(null, 'null')
      check(undefined, 'undefined')

      Object.prototype.toString = originalToString
    })
  })

  describe('hashmap.hash()', () => {
    function check(data: unknown, hash: string) {
      expect(hashmap.hash(data)).toBe(hash)
    }

    it('should hash primitives accurately', () => {
      check(null, 'null')
      check(undefined, 'undefined')
      check(true, 'true')
      check(false, 'false')
      check(NaN, 'NaN')
      check(1, '1')
      check(1.1, '1.1')
      check('1.1', '♠1.1')
      check('Test', '♠Test')
    })

    it('should hash objects with primitive representation accurately', () => {
      check(/test/, '/test/')
      check(new Date(Date.parse('Fri, 15 Aug 1986 15:05:00 GMT')), '♣524502300000')
    })

    it('should hash arrays accurately', () => {
      check([], '♥')
      check([1, 2, 3], '♥1⁞2⁞3')
    })

    it('should hash unrecognized objects accurately', () => {
      check({}, '♦1')
      check(HashMap, '♦2')
      check(hashmap, '♦3')
    })

    it('should not add any property to objects', () => {
      const obj = {}
      hashmap.hash(obj)
      expect(obj).toEqual({})
      expect(Object.getOwnPropertyNames(obj)).toEqual([])
    })

    it('should hash the same object to the same value across instances', () => {
      const obj = {}
      const other = new HashMap()
      hashmap.hash(obj)
      expect(other.hash(obj)).toBe(hashmap.hash(obj))
    })

    it('should distinguish number and string keys', () => {
      expect(hashmap.hash(1)).not.toBe(hashmap.hash('1'))
    })
  })

  describe('method chaining', () => {
    it('should return the instance on some methods', () => {
      expect(hashmap.set('key', 'value')).toBe(hashmap)
      expect(hashmap.multi()).toBe(hashmap)
      expect(hashmap.delete('key')).toBe(hashmap)
      expect(hashmap.remove('key')).toBe(hashmap)
      expect(hashmap.copy(hashmap)).toBe(hashmap)
      expect(hashmap.clear()).toBe(hashmap)
      expect(hashmap.forEach(function () {})).toBe(hashmap)
    })
  })

  describe('hashmap.has()', () => {
    it('should return false when it does not have an entry with a key', () => {
      expect(hashmap.has('key')).toBe(false)
    })

    it('should return true when it has an entry with a key', () => {
      hashmap.set('key', 'value')
      expect(hashmap.has('key')).toBe(true)
    })

    it('should work with non-string keys', () => {
      const keys = [1, null, undefined, false, NaN, /re/, [], {}]
      keys.forEach((key) => {
        hashmap.set(key, 'value')
        expect(hashmap.has(key)).toBe(true)
      })
    })
  })

  describe('hashmap.search()', () => {
    it('should return null when it does not have an entry with a value', () => {
      expect(hashmap.search('value')).toBeNull()
    })

    it('should return key under which a value is stored', () => {
      hashmap.set('key', 'value')
      expect(hashmap.search('value')).toBe('key')
    })
  })

  describe('hashmap.delete()', () => {
    it('should delete an entry by key', () => {
      hashmap.set('key', 'value1')
      hashmap.delete('key')
      expect(hashmap.has('key')).toBe(false)
    })

    it('should not fail when the key is not found', () => {
      hashmap.delete('key')
      expect(hashmap.has('key')).toBe(false)
    })
  })

  describe('hashmap.remove()', () => {
    it('should be the same function as delete', () => {
      expect(hashmap.remove).toBe(hashmap.delete)
    })
  })

  describe('hashmap.get()', () => {
    let uid = 1
    function val() {
      return 'value' + uid++
    }

    it('should map the same key consistenly to the same hash', () => {
      function check(key: unknown) {
        const value = val()
        hashmap.set(key, value)
        expect(hashmap.get(key)).toBe(value)
      }

      check(null)
      check(undefined)
      check(false)
      check(NaN)
      check(1)
      check('Test')
      check(/test/)
      check(new Date(1986, 7, 15, 12, 5, 0, 0))
      check([])
      check({})
      check(HashMap)
      check(hashmap)
    })

    it('should map the same object across instances', () => {
      const obj = {}
      const other = new HashMap()
      hashmap.set(obj, 'value')
      other.set(obj, 'value2')
      expect(other.get(obj)).toBe('value2')
      expect(hashmap.get(obj)).toBe('value')
    })

    it('should map these pair of keys to the same hash', () => {
      function check(key: unknown, key2: unknown) {
        const value = val()
        hashmap.set(key, value)
        expect(hashmap.get(key2)).toBe(value)
      }

      check(null, null)
      check(undefined, undefined)
      check(false, false)
      check(NaN, NaN)
      check(1, 1)
      check('Test', 'Test')
      check(/test/, /test/)
      check(new Date(1986, 7, 15, 12, 5, 0, 0), new Date(1986, 7, 15, 12, 5, 0, 0))
      check([], [])
      check([1, 2, 'Q'], [1, 2, 'Q'])
      check([null, /a/, NaN], [null, /a/, NaN])
    })

    it('should NOT map these pair of keys to the same hash', () => {
      function check(key: unknown, key2: unknown) {
        const value = val()
        hashmap.set(key, value)
        expect(hashmap.get(key2)).not.toBe(value)
      }

      check(null, undefined)
      check(null, false)
      check(false, 0)
      check(false, '')
      check(1, '1')
      check(/test/, /test2/)
      check(/test/, '/test/')
      check(new Date(123456789), new Date(987654321))
      check({}, {})
      check(hashmap, Object.create(hashmap))
    })
  })

  describe('hashmap.forEach()', () => {
    function collect() {
      const pairs: { key: unknown, value: unknown }[] = []
      hashmap.forEach((value, key) => {
        pairs.push({ key, value })
      })
      return pairs
    }

    it('should pass the basic test', () => {
      hashmap.set('key', 'value')
      let called = 0
      hashmap.forEach(function (this: HashMap, value, key) {
        called++
        expect(value).toBe('value')
        expect(key).toBe('key')
        expect(this).toBe(hashmap)
      })
      expect(called).toBe(1)
    })

    it('should call the callback once per key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      hashmap.set('key2', 'value2a')
      expect(collect().length).toBe(2)
    })

    it('should not call the callback on delete keys', () => {
      hashmap.set('key', 'value')
      hashmap.delete('key')
      expect(collect()).toEqual([])
    })

    it('should remain consistent among calls', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(collect()).toEqual(collect())
    })

    it('should respect forEach context', () => {
      hashmap.set('key', 'value')
      const ctx = {}
      hashmap.forEach(function (this: typeof ctx, _value, _key) {
        expect(this).toBe(ctx)
      }, ctx)
    })
  })

  describe('hashmap.keys()', () => {
    it('should return an empty array for an empty hashmap', () => {
      expect(hashmap.keys()).toEqual([])
    })

    it('should return an array with one key once added', () => {
      hashmap.set('key', 'value')
      expect(hashmap.keys()).toEqual(['key'])
    })

    it('should work for several keys', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(hashmap.keys()).toEqual(['key', 'key2'])
    })
  })

  describe('hashmap.values()', () => {
    it('should return an empty array for an empty hashmap', () => {
      expect(hashmap.values()).toEqual([])
    })

    it('should return an array with one value once added', () => {
      hashmap.set('key', 'value')
      expect(hashmap.values()).toEqual(['value'])
    })

    it('should work for several values', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(hashmap.values()).toEqual(['value', 'value2'])
    })
  })

  describe('hashmap.entries()', () => {
    it('should return an empty array for an empty hashmap', () => {
      expect(hashmap.entries()).toEqual([])
    })

    it('should return an array with one value once added', () => {
      hashmap.set('key', 'value')
      expect(hashmap.entries()).toEqual([['key', 'value']])
    })

    it('should work for several values', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(hashmap.entries()).toEqual([['key', 'value'], ['key2', 'value2']])
    })
  })

  describe('ES6 Iterators', () => {
    it('should do nothing on an empty hashmap', () => {
      const iter = hashmap[Symbol.iterator]()
      expect(iter.next().done).toBe(true)
    })

    it('should iterate over all entries exactly once', () => {
      const numberOfTries = 10
      const calls = new Array(numberOfTries).fill(0)
      for (let i = 0; i < numberOfTries; i++) {
        hashmap.set('key' + i, i)
      }
      for (const pair of hashmap) {
        expect(pair.key).toBe('key' + pair.value)
        calls[pair.value as number]++
      }
      expect(calls).toEqual(new Array(numberOfTries).fill(1))
    })
  })

  describe('hashmap.size and hashmap.count()', () => {
    it('should return 0 when nothing was added', () => {
      expect(hashmap.size).toBe(0)
      expect(hashmap.count()).toBe(0)
    })

    it('should return 1 once an entry was added', () => {
      hashmap.set('key', 'value')
      expect(hashmap.size).toBe(1)
      expect(hashmap.count()).toBe(1)
    })

    it('should not increase when setting an existing key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key', 'value2')
      expect(hashmap.size).toBe(1)
      expect(hashmap.count()).toBe(1)
    })

    it('should increase when setting different key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(hashmap.size).toBe(2)
      expect(hashmap.count()).toBe(2)
    })

    it('should decrease when deleting a key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value')
      hashmap.delete('key')
      expect(hashmap.size).toBe(1)
      expect(hashmap.count()).toBe(1)

      hashmap.delete('key2')
      expect(hashmap.size).toBe(0)
      expect(hashmap.count()).toBe(0)
    })
  })

  describe('hashmap.clear()', () => {
    it('should do nothing when empty', () => {
      hashmap.clear()
      expect(hashmap.size).toBe(0)
    })

    it('should delete the only entry', () => {
      hashmap.set('key', 'value')
      hashmap.clear()
      expect(hashmap.size).toBe(0)
    })

    it('should delete multiple entries', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      hashmap.clear()
      expect(hashmap.size).toBe(0)
    })
  })

  describe('hashmap.copy()', () => {
    it('should work on an empty hashmap', () => {
      const map = new HashMap()
      map.copy(hashmap)
      expect(map.size).toBe(0)
    })

    it('should copy all values', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')

      const map = new HashMap()
      map.copy(hashmap)

      expect(map.size).toBe(2)
      expect(map.get('key')).toBe('value')
      expect(map.get('key2')).toBe('value2')
    })

    it('should merge without losing existing entries', () => {
      const a = new HashMap()
      a.set('x', 1)
      const b = new HashMap()
      b.set('y', 2)
      a.copy(b)
      expect(a.size).toBe(2)
      expect(a.get('x')).toBe(1)
      expect(a.get('y')).toBe(2)
    })

    it('should overwrite overlapping keys from source', () => {
      const a = new HashMap()
      a.set('k', 'old')
      const b = new HashMap()
      b.set('k', 'new')
      a.copy(b)
      expect(a.get('k')).toBe('new')
      expect(a.size).toBe(1)
    })
  })

  describe('hashmap.clone()', () => {
    it('should return a new hashmap', () => {
      const clone = hashmap.clone()
      expect(clone).toBeInstanceOf(HashMap)
      expect(clone).not.toBe(hashmap)
    })

    it('should work on an empty hashmap', () => {
      const clone = hashmap.clone()
      expect(clone.size).toBe(0)
    })

    it('should retain all values', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      const clone = hashmap.clone()
      expect(clone.size).toBe(2)
      expect(clone.get('key')).toBe('value')
      expect(clone.get('key2')).toBe('value2')
      expect(hashmap.size).toBe(2)
      expect(hashmap.get('key')).toBe('value')
      expect(hashmap.get('key2')).toBe('value2')
    })

    it('should not mutate original when clone updates existing string key', () => {
      hashmap.set('x', 1)
      const clone = hashmap.clone()
      clone.set('x', 2)
      expect(hashmap.get('x')).toBe(1)
      expect(clone.get('x')).toBe(2)
    })

    it('should not mutate original when clone updates existing object key', () => {
      const key = {}
      hashmap.set(key, 'a')
      const clone = hashmap.clone()
      clone.set(key, 'b')
      expect(hashmap.get(key)).toBe('a')
      expect(clone.get(key)).toBe('b')
    })

    it('should allow new keys on clone without affecting original', () => {
      hashmap.set('x', 1)
      const clone = hashmap.clone()
      clone.set('y', 2)
      expect(hashmap.has('y')).toBe(false)
      expect(hashmap.size).toBe(1)
      expect(clone.size).toBe(2)
    })

    it('should isolate delete on clone', () => {
      hashmap.set('k', 1)
      const clone = hashmap.clone()
      clone.delete('k')
      expect(hashmap.has('k')).toBe(true)
      expect(clone.has('k')).toBe(false)
    })
  })

  describe('hashmap.multi()', () => {
    it('should do nothing with no arguments', () => {
      hashmap.multi()
      expect(hashmap.size).toBe(0)
    })

    it('should work with one pair', () => {
      hashmap.multi('key', 'value')
      expect(hashmap.size).toBe(1)
      expect(hashmap.get('key')).toBe('value')
    })

    it('should work with several pairs', () => {
      hashmap.multi(
        'key', 'value',
        'key2', 'value2',
      )
      expect(hashmap.size).toBe(2)
      expect(hashmap.get('key')).toBe('value')
      expect(hashmap.get('key2')).toBe('value2')
    })
  })

  describe('constructor', () => {
    it('should create an empty hashmap when no arguments', () => {
      expect(hashmap.size).toBe(0)
    })

    it('should clone a hashmap when one argument', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')

      const map = new HashMap(hashmap)
      expect(map.size).toBe(2)
      expect(map.get('key')).toBe('value')
      expect(map.get('key2')).toBe('value2')
    })

    it('should initialize from a 2D array for a single Array argument', () => {
      const map = new HashMap(
        [['key', 'value'],
          ['key2', 'value2']],
      )
      expect(map.size).toBe(2)
      expect(map.get('key')).toBe('value')
      expect(map.get('key2')).toBe('value2')
    })

    it('should initialize from a 2D array for a nested Array argument', () => {
      const map = new HashMap(
        [[[1, 'key'], ['value', 1]],
          [[2, 'key2'], ['value2', 2]]],
      )
      expect(map.size).toBe(2)
      expect(map.get([1, 'key'])).toEqual(['value', 1])
      expect(map.get([2, 'key2'])).toEqual(['value2', 2])
    })

    it('should initialize with pairs when several arguments', () => {
      const map = new HashMap(
        'key', 'value',
        'key2', 'value2',
      )
      expect(map.size).toBe(2)
      expect(map.get('key')).toBe('value')
      expect(map.get('key2')).toBe('value2')
    })
  })

  describe('constructor clone isolation (2.4 compat)', () => {
    it('should not mutate source when copy updates existing key', () => {
      hashmap.set('x', 1)
      const copy = new HashMap(hashmap)
      copy.set('x', 2)
      expect(hashmap.get('x')).toBe(1)
      expect(copy.get('x')).toBe(2)
    })
  })

  describe('forEach with mutation', () => {
    it('should tolerate remove during forEach', () => {
      hashmap.set('a', 1)
      hashmap.set('b', 2)
      hashmap.set('c', 3)
      hashmap.forEach((_value, key) => {
        if (key === 'b') {
          hashmap.remove(key)
        }
      })
      expect(hashmap.keys()).toEqual(['a', 'c'])
      expect(hashmap.size).toBe(2)
    })
  })

  describe('object-key pool', () => {
    it('should track object keys with deprecated remove and count', () => {
      const pool = new HashMap()
      const res1 = { id: 1 }
      const res2 = { id: 2 }
      pool.set(res1, new Date())
      pool.set(res2, new Date())
      expect(pool.count()).toBe(2)
      pool.remove(res1)
      expect(pool.count()).toBe(1)
      expect(pool.has(res1)).toBe(false)
      expect(pool.has(res2)).toBe(true)
      pool.clear()
      expect(pool.size).toBe(0)
    })
  })

  describe('stored undefined value', () => {
    it('should distinguish missing key from undefined value', () => {
      hashmap.set('key', undefined)
      expect(hashmap.has('key')).toBe(true)
      expect(hashmap.get('key')).toBeUndefined()
      expect(hashmap.get('missing')).toBeUndefined()
    })
  })

  describe('equal RegExp keys (3.0 collision handling)', () => {
    it('should treat equal regex patterns as one key', () => {
      const r1 = /test/
      const r2 = /test/
      hashmap.set(r1, 'a')
      hashmap.set(r2, 'b')
      expect(hashmap.size).toBe(1)
      expect(hashmap.get(r1)).toBe('b')
      expect(hashmap.get(r2)).toBe('b')
    })
  })

  describe('constructor array-like rejection (2.4 behavior change)', () => {
    it('should throw when given array-like non-Array', () => {
      const arrayLike = { length: 2, 0: ['k', 'v'], 1: ['k2', 'v2'] }
      expect(() => new HashMap(arrayLike as unknown as unknown[][])).toThrow()
    })
  })

  describe('package import interop', () => {
    describe.skipIf(!hasDist)('CJS require', () => {
      it('should construct via require()', () => {
        const require = createRequire(import.meta.url)
        const HashMapCjs = require(distCjs)
        expect(typeof HashMapCjs).toBe('function')
        expect(HashMapCjs).toBe(HashMapCjs.HashMap)
        const map = new HashMapCjs()
        map.set('a', 1)
        expect(map.get('a')).toBe(1)
      })

      it('should construct via require().HashMap', () => {
        const require = createRequire(import.meta.url)
        const mod = require(distCjs)
        const HashMapCjs = mod.HashMap
        expect(HashMapCjs).toBe(mod)
        const map = new HashMapCjs()
        map.set(5, 'code')
        map.set('code', 5)
        expect(map.get(5)).toBe('code')
        expect(map.get('code')).toBe(5)
        expect(map.size).toBe(2)
      })
    })

    describe.skipIf(!hasDist)('ESM import', () => {
      it('should construct via default import from dist', async () => {
        const mod = await import(distEsmUrl)
        const HashMapEsm = mod.default
        expect(typeof HashMapEsm).toBe('function')
        expect(HashMapEsm).toBe(HashMapEsm.HashMap)
        const map = new HashMapEsm()
        map.set('key', 'value')
        expect(map.get('key')).toBe('value')
      })

      it('should construct via namespace import .default (not bare namespace)', async () => {
        const NS = await import(distEsmUrl)
        expect(() => new (NS as unknown as new () => HashMap)()).toThrow()
        const map = new NS.default()
        map.set('key', 'value')
        expect(map.get('key')).toBe('value')
      })
    })

    describe.skipIf(!hasDist)('IIFE script', () => {
      it('should expose HashMap global', () => {
        const script = readFileSync(distIife, 'utf8')
        const sandbox: { HashMap?: typeof HashMap } = {}
        vm.runInNewContext(script, sandbox)
        const HashMapGlobal = sandbox.HashMap
        expect(typeof HashMapGlobal).toBe('function')
        expect(HashMapGlobal).toBe(HashMapGlobal!.HashMap)
        const map = new HashMapGlobal!()
        map.set('x', 1)
        expect(map.get('x')).toBe(1)
      })
    })
  })
})
