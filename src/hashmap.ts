type Entry = { key: unknown, value: unknown, index: number, hash: number }

type HashMapInit<TKey, TValue> =
  | HashMap<TKey, TValue>
  | [TKey, TValue][]

type Slot = Entry | Entry[]

class HashMap<TKey = unknown, TValue = unknown> {
  static uid = 0
  // Legacy CJS: require('hashmap').HashMap (assigned below on the default export)
  static HashMap: typeof HashMap

  size = 0
  private _entries: Entry[] = []
  private _index = new Map<number, Slot>()

  constructor()
  constructor(other: HashMapInit<TKey, TValue>)
  constructor(...pairs: (TKey | TValue)[])
  constructor(other?: unknown, ...pairs: unknown[]) {
    this.clear()
    const args = other === undefined ? pairs : [other, ...pairs]
    switch (args.length) {
      case 0:
        break
      case 1: {
        const first = args[0]
        if (first && Array.isArray(first)) {
          multi(this, (first as unknown[][]).flat())
        } else {
          this.copy(first as HashMap<TKey, TValue>)
        }
        break
      }
      default:
        multi(this, args)
        break
    }
  }

  get(key: TKey): TValue | undefined {
    const entry = findEntry(this._index.get(fastHash(key)), key)
    return entry ? entry.value as TValue : undefined
  }

  set(key: TKey, value: TValue): this {
    const hash = fastHash(key)
    const slot = this._index.get(hash)
    if (slot) {
      const existing = findEntry(slot, key)
      if (existing) {
        existing.value = value
        return this
      }
    }

    const entry: Entry = { key, value, index: this._entries.length, hash }
    if (slot) {
      if (Array.isArray(slot)) {
        slot.push(entry)
      } else {
        this._index.set(hash, [slot, entry])
      }
    } else {
      this._index.set(hash, entry)
    }
    this._entries.push(entry)
    this.size++
    return this
  }

  multi(...args: unknown[]): this {
    multi(this, args)
    return this
  }

  copy(other: HashMap<TKey, TValue>): this {
    const otherEntries = other._entries
    const len = otherEntries.length
    if (len === 0) {
      return this
    }

    if (this.size === 0) {
      this._entries = cloneEntries(otherEntries)
      this._index = rebuildIndex(this._entries)
      this.size = other.size
      return this
    }

    for (let i = 0; i < len; i++) {
      const source = otherEntries[i]
      const hash = source.hash
      const slot = this._index.get(hash)
      const existing = slot ? findEntry(slot, source.key) : undefined
      if (existing) {
        existing.value = source.value
      } else {
        const entry: Entry = { key: source.key, value: source.value, index: this._entries.length, hash }
        if (slot) {
          if (Array.isArray(slot)) {
            slot.push(entry)
          } else {
            this._index.set(hash, [slot, entry])
          }
        } else {
          this._index.set(hash, entry)
        }
        this._entries.push(entry)
        this.size++
      }
    }
    return this
  }

  has(key: TKey): boolean {
    return !!findEntry(this._index.get(fastHash(key)), key)
  }

  search(value: TValue): TKey | null {
    const entries = this._entries
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].value === value) {
        return entries[i].key as TKey
      }
    }
    return null
  }

  delete(key: TKey): this {
    const hash = fastHash(key)
    const slot = this._index.get(hash)
    if (!slot) {
      return this
    }

    if (Array.isArray(slot)) {
      for (let i = 0; i < slot.length; i++) {
        if (keyEquals(slot[i].key, key)) {
          const removed = slot[i]
          if (slot.length === 2) {
            this._index.set(hash, slot[1 - i])
          } else {
            slot.splice(i, 1)
          }
          removeEntry(this._entries, removed)
          this.size--
          return this
        }
      }
      return this
    }

    if (keyEquals(slot.key, key)) {
      this._index.delete(hash)
      removeEntry(this._entries, slot)
      this.size--
    }
    return this
  }

  /** @deprecated Use `.delete()` instead. */
  declare remove: (key: TKey) => this

  /** @deprecated Use `.size` instead. */
  count(): number {
    return this.size
  }

  /** @deprecated Internal helper; not used by the map implementation. */
  type(key: unknown): string {
    return typeOf(key)
  }

  keys(): TKey[] {
    const entries = this._entries
    const out = new Array(entries.length)
    for (let i = 0; i < entries.length; i++) {
      out[i] = entries[i].key
    }
    return out as TKey[]
  }

  values(): TValue[] {
    const entries = this._entries
    const out = new Array(entries.length)
    for (let i = 0; i < entries.length; i++) {
      out[i] = entries[i].value
    }
    return out as TValue[]
  }

  entries(): [TKey, TValue][] {
    const entries = this._entries
    const out = new Array(entries.length)
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      out[i] = [entry.key, entry.value] as [TKey, TValue]
    }
    return out as [TKey, TValue][]
  }

  clear(): this {
    this._entries = []
    this._index.clear()
    this.size = 0
    return this
  }

  clone(): HashMap<TKey, TValue> {
    const cloned = Object.create(HashMap.prototype) as HashMap<TKey, TValue>
    cloned._entries = cloneEntries(this._entries)
    cloned._index = rebuildIndex(cloned._entries)
    cloned.size = this.size
    return cloned
  }

  forEach(func: (value: TValue, key: TKey) => void, ctx?: unknown): this {
    const entries = this._entries
    const context = ctx || this
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      func.call(context, entry.value as TValue, entry.key as TKey)
    }
    return this
  }

  [Symbol.iterator](): Iterator<{ key: TKey, value: TValue }> {
    const entries = this._entries
    let i = 0
    return {
      next: () => {
        if (i === entries.length) {
          return { done: true as const, value: undefined }
        }
        const entry = entries[i++]
        return {
          value: { key: entry.key as TKey, value: entry.value as TValue },
          done: false as const,
        }
      },
    }
  }
}

function multi(map: HashMap<any, any>, args: unknown[]) {
  for (let i = 0; i < args.length; i += 2) {
    map.set(args[i], args[i + 1])
  }
}

function cloneEntries(entries: Entry[]): Entry[] {
  return entries.map((entry, index) => ({
    key: entry.key,
    value: entry.value,
    index,
    hash: entry.hash,
  }))
}

function rebuildIndex(entries: Entry[]): Map<number, Slot> {
  const index = new Map<number, Slot>()
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const hash = entry.hash
    const slot = index.get(hash)
    if (slot) {
      if (Array.isArray(slot)) {
        slot.push(entry)
      } else {
        index.set(hash, [slot, entry])
      }
    } else {
      index.set(hash, entry)
    }
  }
  return index
}

function typeOf(key: unknown): string {
  const t = typeof key
  if (t === 'number' || t === 'string' || t === 'boolean' || t === 'undefined') {
    return t
  }
  if (key === null) {
    return 'null'
  }
  if (t === 'function') {
    return 'function'
  }
  if (Array.isArray(key)) {
    return 'array'
  }
  if (key instanceof Date) {
    return 'date'
  }
  if (key instanceof RegExp) {
    return 'regexp'
  }
  const str = Object.prototype.toString.call(key)
  let typeName = str.slice(8, -1).toLowerCase()
  if (!key && (typeName === 'domwindow' || typeName === 'window')) {
    return key + ''
  }
  return typeName
}

const objectUids = new WeakMap<object, number>()

function objectUid(key: unknown): number {
  const obj = key as object
  let uid = objectUids.get(obj)
  if (uid === undefined) {
    uid = ++HashMap.uid
    objectUids.set(obj, uid)
  }
  return uid
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mixHash(h: number, n: number): number {
  return Math.imul(h ^ n, 2654435761) >>> 0
}

const numBuf = new ArrayBuffer(8)
const numFloat = new Float64Array(numBuf)
const numInts = new Uint32Array(numBuf)

function hashNumber(n: number): number {
  if (n !== n) {
    return 0x7f1a00ff
  }
  numFloat[0] = n === 0 ? 0 : n
  return mixHash(mixHash(0x7f1a0005, numInts[0]), numInts[1])
}

function fastHash(key: unknown): number {
  const t = typeof key
  if (t === 'string') {
    return mixHash(0x7f1a0008, hashString(key as string))
  }
  if (t === 'number') {
    return hashNumber(key as number)
  }
  if (t === 'boolean') {
    return key ? 0x7f1a0003 : 0x7f1a0004
  }
  if (t === 'undefined') {
    return 0x7f1a0001
  }
  if (key === null) {
    return 0x7f1a0002
  }
  if (t === 'function') {
    return mixHash(0x7f1a000a, objectUid(key))
  }
  if (Array.isArray(key)) {
    const arr = key as unknown[]
    let h = 0x7f1a0009
    for (let i = 0; i < arr.length; i++) {
      h = mixHash(h, fastHash(arr[i]))
    }
    return h
  }
  if (key instanceof Date) {
    const time = (key as Date).getTime()
    return mixHash(mixHash(0x7f1a0007, time | 0), time / 0x100000000 | 0)
  }
  if (key instanceof RegExp) {
    return mixHash(0x7f1a0006, hashString((key as RegExp) + ''))
  }
  return mixHash(0x7f1a000a, objectUid(key))
}

function keyEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  const ta = typeof a
  const tb = typeof b

  if (ta === 'string' && tb === 'string') {
    return false
  }
  if (ta === 'number' && tb === 'number') {
    return Number.isNaN(a as number) && Number.isNaN(b as number)
  }
  if (ta === 'boolean' && tb === 'boolean') {
    return false
  }
  if (ta === 'undefined' && tb === 'undefined') {
    return false
  }

  if (a === null || b === null) {
    return false
  }

  if (ta !== tb) {
    return false
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false
    }
    const aa = a as unknown[]
    const bb = b as unknown[]
    if (aa.length !== bb.length) {
      return false
    }
    for (let i = 0; i < aa.length; i++) {
      if (!keyEquals(aa[i], bb[i])) {
        return false
      }
    }
    return true
  }

  if (a instanceof Date) {
    return b instanceof Date && (a as Date).getTime() === (b as Date).getTime()
  }

  if (a instanceof RegExp) {
    return b instanceof RegExp && (a as RegExp) + '' === (b as RegExp) + ''
  }

  return objectUid(a) === objectUid(b)
}

function findEntry(slot: Slot | undefined, key: unknown): Entry | undefined {
  if (!slot) {
    return undefined
  }
  if (Array.isArray(slot)) {
    for (let i = 0; i < slot.length; i++) {
      if (keyEquals(slot[i].key, key)) {
        return slot[i]
      }
    }
    return undefined
  }
  return keyEquals(slot.key, key) ? slot : undefined
}

function removeEntry(entries: Entry[], entry: Entry) {
  const i = entry.index
  const last = entries.length - 1
  if (i < 0 || i > last || entries[i] !== entry) {
    return
  }
  if (i !== last) {
    const moved = entries[last]
    entries[i] = moved
    moved.index = i
  }
  entries.pop()
}

HashMap.prototype.remove = HashMap.prototype.delete
HashMap.HashMap = HashMap

export { HashMap }
export default HashMap
