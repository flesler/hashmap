type Entry = [unknown, unknown]

type HashMapInit =
  | HashMap
  | unknown[][]
  | unknown

export class HashMap {
  static uid = 0

  size = 0
  private _data: Record<string, Entry> = {}

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
    const data = this._data[this.hash(key)]
    return data && data[1]
  }

  set(key: unknown, value: unknown): this {
    const hash = this.hash(key)
    if (!(hash in this._data)) {
      this.size++
    }
    this._data[hash] = [key, value]
    return this
  }

  multi(...args: unknown[]): this {
    multi(this, args)
    return this
  }

  copy(other: HashMap): this {
    for (const hash in other._data) {
      if (!(hash in this._data)) {
        this.size++
      }
      this._data[hash] = other._data[hash]
    }
    return this
  }

  has(key: unknown): boolean {
    return this.hash(key) in this._data
  }

  search(value: unknown): unknown {
    for (const key in this._data) {
      if (this._data[key][1] === value) {
        return this._data[key][0]
      }
    }
    return null
  }

  delete(key: unknown): this {
    const hash = this.hash(key)
    if (hash in this._data) {
      this.size--
      delete this._data[hash]
    }
    return this
  }

  remove(key: unknown): this {
    return this.delete(key)
  }

  type(key: unknown): string {
    const str = Object.prototype.toString.call(key)
    let typeName = str.slice(8, -1).toLowerCase()
    if (!key && (typeName === 'domwindow' || typeName === 'window')) {
      return key + ''
    }
    return typeName
  }

  keys(): unknown[] {
    const keys: unknown[] = []
    this.forEach((_, key) => { keys.push(key) })
    return keys
  }

  values(): unknown[] {
    const values: unknown[] = []
    this.forEach((value) => { values.push(value) })
    return values
  }

  entries(): unknown[][] {
    const entries: unknown[][] = []
    this.forEach((value, key) => { entries.push([key, value]) })
    return entries
  }

  count(): number {
    return this.size
  }

  clear(): this {
    this._data = {}
    this.size = 0
    return this
  }

  clone(): HashMap {
    return new HashMap(this)
  }

  hash(key: unknown): string {
    switch (this.type(key)) {
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
          hashes[i] = this.hash((key as unknown[])[i])
        }
        return '♥' + hashes.join('⁞')
      }

      default: {
        const obj = key as Record<string, unknown>
        if (!Object.prototype.hasOwnProperty.call(obj, '_hmuid_')) {
          obj._hmuid_ = ++HashMap.uid
          hide(obj, '_hmuid_')
        }
        return '♦' + obj._hmuid_
      }
    }
  }

  forEach(func: (value: unknown, key: unknown) => void, ctx?: unknown): this {
    for (const key in this._data) {
      const data = this._data[key]
      func.call(ctx || this, data[1], data[0])
    }
    return this
  }

  [Symbol.iterator](): Iterator<{ key: unknown, value: unknown }> {
    const entries = this.entries()
    let i = 0
    return {
      next: () => {
        if (i === entries.length) {
          return { done: true as const, value: undefined }
        }
        const currentEntry = entries[i++]
        return {
          value: { key: currentEntry[0], value: currentEntry[1] },
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

function hide(obj: object, prop: string) {
  if (Object.defineProperty) {
    Object.defineProperty(obj, prop, { enumerable: false })
  }
}
