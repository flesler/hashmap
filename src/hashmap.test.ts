import { describe, it, expect, beforeEach } from 'vitest'
import { HashMap } from './hashmap.js'

let hashmap: HashMap

describe('hashmap', () => {
  beforeEach(() => {
    hashmap = new HashMap()
  })

  describe('method chaining', () => {
    it('should return the instance on some methods', () => {
      expect(hashmap.set('key', 'value')).toBe(hashmap)
      expect(hashmap.multi()).toBe(hashmap)
      expect(hashmap.delete('key')).toBe(hashmap)
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

  describe('hashmap.size', () => {
    it('should return 0 when nothing was added', () => {
      expect(hashmap.size).toBe(0)
    })

    it('should return 1 once an entry was added', () => {
      hashmap.set('key', 'value')
      expect(hashmap.size).toBe(1)
    })

    it('should not increase when setting an existing key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key', 'value2')
      expect(hashmap.size).toBe(1)
    })

    it('should increase when setting different key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value2')
      expect(hashmap.size).toBe(2)
    })

    it('should decrease when deleting a key', () => {
      hashmap.set('key', 'value')
      hashmap.set('key2', 'value')
      hashmap.delete('key')
      expect(hashmap.size).toBe(1)

      hashmap.delete('key2')
      expect(hashmap.size).toBe(0)
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
})
