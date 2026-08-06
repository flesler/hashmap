type Entry = { key: unknown, value: unknown, index: number }

type HashMapInit =
  | HashMap
  | unknown[][]
  | unknown

type Slot = Entry | Entry[]

export class HashMap {
  static uid = 0
  static HashMap: typeof HashMap

  size = 0
  private _entries: Entry[] = []
  private _index: Record<number, Slot> = {}

  constructor()
  constructor(other: HashMapInit)
  constructor(...pairs: unknown[])
  constructor(other?: unknown, ...pairs: unknown[]) {
    this.clear()
    const args = other === undefined ? pairs : [other, ...pairs]
    switch (args.length) {
      case 0:
        break
      case 1: {
        const first = args[0]
        if (first && typeof first === 'object' && 'length' in first && Array.isArray(first)) {
          multi(this, Array.prototype.concat.apply([], first as unknown[][]))
        } else {
          this.copy(first as HashMap)
        }
        break
      }
      default:
        multi(this, args)
        break
    }
  }

  get(key: unknown): unknown {
    const entry = findEntry(this._index[fastHash(key)], key)
    return entry && entry.value
  }

  set(key: unknown, value: unknown): this {
    const hash = fastHash(key)
    const slot = this._index[hash]
    if (slot) {
      const existing = findEntry(slot, key)
      if (existing) {
        existing.value = value
        return this
      }
    }

    const entry: Entry = { key, value, index: this._entries.length }
    if (slot) {
      if (Array.isArray(slot)) {
        slot.push(entry)
      } else {
        this._index[hash] = [slot, entry]
      }
    } else {
      this._index[hash] = entry
    }
    this._entries.push(entry)
    this.size++
    return this
  }

  multi(...args: unknown[]): this {
    multi(this, args)
    return this
  }

  copy(other: HashMap): this {
    const otherEntries = other._entries
    const len = otherEntries.length
    if (len === 0) {
      return this
    }

    if (this.size === 0) {
      this._entries = other._entries.slice()
      for (let i = 0; i < len; i++) {
        this._entries[i].index = i
      }
      this._index = { ...other._index }
      this.size = len
      return this
    }

    for (let i = 0; i < len; i++) {
      const source = otherEntries[i]
      const hash = fastHash(source.key)
      const slot = this._index[hash]
      const existing = slot ? findEntry(slot, source.key) : undefined
      if (existing) {
        existing.value = source.value
      } else {
        const entry: Entry = { key: source.key, value: source.value, index: this._entries.length }
        if (slot) {
          if (Array.isArray(slot)) {
            slot.push(entry)
          } else {
            this._index[hash] = [slot, entry]
          }
        } else {
          this._index[hash] = entry
        }
        this._entries.push(entry)
        this.size++
      }
    }
    return this
  }

  has(key: unknown): boolean {
    return !!findEntry(this._index[fastHash(key)], key)
  }

  search(value: unknown): unknown {
    const entries = this._entries
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].value === value) {
        return entries[i].key
      }
    }
    return null
  }

  delete(key: unknown): this {
    const hash = fastHash(key)
    const slot = this._index[hash]
    if (!slot) {
      return this
    }

    if (Array.isArray(slot)) {
      for (let i = 0; i < slot.length; i++) {
        if (keyEquals(slot[i].key, key)) {
          const removed = slot[i]
          if (slot.length === 2) {
            this._index[hash] = slot[1 - i]
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
      delete this._index[hash]
      removeEntry(this._entries, slot)
      this.size--
    }
    return this
  }

  /** @deprecated Use `.delete()` instead. */
  declare remove: (key: unknown) => this

  /** @deprecated Use `.size` instead. */
  count(): number {
    return this.size
  }

  /** @deprecated Internal helper; not used by the map implementation. */
  type(key: unknown): string {
    return typeOf(key)
  }

  /** @deprecated Legacy string hash; not used by the map implementation. */
  hash(key: unknown): string {
    return legacyHash(key)
  }

  keys(): unknown[] {
    const keys: unknown[] = []
    this.forEach((_, key) => {
      keys.push(key)
    })
    return keys
  }

  values(): unknown[] {
    const values: unknown[] = []
    this.forEach((value) => {
      values.push(value)
    })
    return values
  }

  entries(): unknown[][] {
    const entries: unknown[][] = []
    this.forEach((value, key) => {
      entries.push([key, value])
    })
    return entries
  }

  clear(): this {
    this._entries = []
    this._index = {}
    this.size = 0
    return this
  }

  clone(): HashMap {
    const cloned = Object.create(HashMap.prototype) as HashMap
    cloned.size = this.size
    cloned._entries = this._entries.slice()
    cloned._index = { ...this._index }
    for (let i = 0; i < cloned._entries.length; i++) {
      cloned._entries[i].index = i
    }
    return cloned
  }

  forEach(func: (value: unknown, key: unknown) => void, ctx?: unknown): this {
    const entries = this._entries
    const context = ctx || this
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      func.call(context, entry.value, entry.key)
    }
    return this
  }

  [Symbol.iterator](): Iterator<{ key: unknown, value: unknown }> {
    const entries = this._entries
    let i = 0
    return {
      next: () => {
        if (i === entries.length) {
          return { done: true as const, value: undefined }
        }
        const entry = entries[i++]
        return {
          value: { key: entry.key, value: entry.value },
          done: false as const,
        }
      },
    }
  }
}

function multi(map: HashMap, args: unknown[]) {
  for (let i = 0; i < args.length; i += 2) {
    map.set(args[i], args[i + 1])
  }
}

function typeOf(key: unknown): string {
  const str = Object.prototype.toString.call(key)
  let typeName = str.slice(8, -1).toLowerCase()
  if (!key && (typeName === 'domwindow' || typeName === 'window')) {
    return key + ''
  }
  return typeName
}

function ensureUid(obj: Record<string, unknown>) {
  if (!Object.prototype.hasOwnProperty.call(obj, '_hmuid_')) {
    obj._hmuid_ = ++HashMap.uid
    hide(obj, '_hmuid_')
  }
}

function hide(obj: object, prop: string) {
  if (Object.defineProperty) {
    Object.defineProperty(obj, prop, { enumerable: false })
  }
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

function fastHash(key: unknown): number {
  switch (typeOf(key)) {
    case 'undefined':
      return 0x7f1a0001
    case 'null':
      return 0x7f1a0002
    case 'boolean':
      return key ? 0x7f1a0003 : 0x7f1a0004
    case 'number':
      return mixHash(0x7f1a0005, hashString((key as number) + ''))
    case 'regexp':
      return mixHash(0x7f1a0006, hashString((key as RegExp) + ''))
    case 'date': {
      const time = (key as Date).getTime()
      return mixHash(mixHash(0x7f1a0007, time | 0), time / 0x100000000 | 0)
    }
    case 'string':
      return mixHash(0x7f1a0008, hashString(key as string))
    case 'array': {
      const arr = key as unknown[]
      let h = 0x7f1a0009
      for (let i = 0; i < arr.length; i++) {
        h = mixHash(h, fastHash(arr[i]))
      }
      return h
    }
    default: {
      const obj = key as Record<string, unknown>
      ensureUid(obj)
      return mixHash(0x7f1a000a, obj._hmuid_ as number)
    }
  }
}

function keyEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }

  const ta = typeOf(a)
  const tb = typeOf(b)
  if (ta !== tb) {
    return false
  }

  switch (ta) {
    case 'undefined':
    case 'null':
    case 'boolean':
      return a === b
    case 'number':
      if (Number.isNaN(a as number) && Number.isNaN(b as number)) {
        return true
      }
      return a === b
    case 'regexp':
      return (a as RegExp) + '' === (b as RegExp) + ''
    case 'date':
      return (a as Date).getTime() === (b as Date).getTime()
    case 'string':
      return a === b
    case 'array': {
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
    default: {
      const oa = a as Record<string, unknown>
      const ob = b as Record<string, unknown>
      ensureUid(oa)
      ensureUid(ob)
      return oa._hmuid_ === ob._hmuid_
    }
  }
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

function legacyHash(key: unknown): string {
  switch (typeOf(key)) {
    case 'undefined':
    case 'null':
    case 'boolean':
    case 'number':
    case 'regexp':
      return key + ''

    case 'date':
      return '♣' + (key as Date).getTime()

    case 'string':
      return '♠' + key

    case 'array': {
      const hashes: string[] = []
      for (let i = 0; i < (key as unknown[]).length; i++) {
        hashes[i] = legacyHash((key as unknown[])[i])
      }
      return '♥' + hashes.join('⁞')
    }

    default: {
      const obj = key as Record<string, unknown>
      ensureUid(obj)
      return '♦' + obj._hmuid_
    }
  }
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
