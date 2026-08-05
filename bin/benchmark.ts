#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import { createRequire } from 'module'
import pkg from '../package.json' with { type: 'json' }

const require = createRequire(import.meta.url)
const { HashMap } = require('../dist/hashmap.cjs')

let outputPath = './tmp/benchmark.json'
let comparePath: string | null = null
const args = process.argv.slice(2)

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-o' && args[i + 1]) {
    outputPath = args[++i]
  } else if (args[i] === '--compare' && args[i + 1]) {
    comparePath = args[++i]
  }
}

const MIN_MS = 250
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function makeid(length: number) {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length))
  }
  return result
}

function measure(name: string, fn: () => void, cycle?: () => void) {
  if (cycle) {
    cycle()
  }

  const start = performance.now()
  let ops = 0

  while (performance.now() - start < MIN_MS) {
    fn()
    ops++
    if (cycle) {
      cycle()
    }
  }

  const elapsedMs = performance.now() - start

  return {
    name,
    ops,
    elapsedMs,
    opsPerSec: ops / (elapsedMs / 1000),
    msPerOp: elapsedMs / ops,
  }
}

function buildPrefilled(size: number) {
  const map = new HashMap()
  for (let i = 0; i < size; i++) {
    map.set(makeid(16), makeid(128))
  }
  return map
}

function runBenchmarks() {
  let key = makeid(16)
  let value = makeid(128)
  const hashmap = new HashMap()
  let hashmap1024 = buildPrefilled(1024)
  let hashmap131072 = buildPrefilled(131072)
  let objectKey: Record<string, never> = {}
  let objectValue = makeid(128)
  const results = []

  results.push(measure('create', () => {
    new HashMap()
  }))

  results.push(measure('singleSet', () => {
    hashmap.set(key, value)
  }, () => {
    key = makeid(16)
    value = makeid(128)
    hashmap.clear()
  }))

  let keys20: string[] = []
  let values20: string[] = []
  for (let i = 0; i < 20; i++) {
    keys20.push(makeid(16))
    values20.push(makeid(128))
  }

  results.push(measure('singleSet20', () => {
    for (let k = 0; k < 20; k++) {
      hashmap.set(keys20[k], values20[k])
    }
  }, () => {
    hashmap.clear()
    keys20 = []
    values20 = []
    for (let j = 0; j < 20; j++) {
      keys20.push(makeid(16))
      values20.push(makeid(128))
    }
  }))

  results.push(measure('singleReplace', () => {
    hashmap.set(key, value)
  }, () => {
    key = makeid(16)
    value = makeid(128)
    hashmap.clear()
    hashmap.set(key, makeid(128))
  }))

  results.push(measure('singleGet', () => {
    hashmap.get(key)
  }, () => {
    key = makeid(16)
    value = makeid(128)
    hashmap.clear()
    hashmap.set(key, value)
  }))

  results.push(measure('has', () => {
    hashmap.has(key)
  }, () => {
    key = makeid(16)
    hashmap.clear()
    hashmap.set(key, makeid(128))
  }))

  results.push(measure('delete', () => {
    hashmap.delete(key)
  }, () => {
    key = makeid(16)
    hashmap.clear()
    hashmap.set(key, makeid(128))
  }))

  results.push(measure('search', () => {
    hashmap.search(value)
  }, () => {
    key = makeid(16)
    value = makeid(128)
    hashmap.clear()
    hashmap.set(key, value)
  }))

  results.push(measure('objectKeySet', () => {
    hashmap.set(objectKey, objectValue)
  }, () => {
    objectKey = {}
    objectValue = makeid(128)
    hashmap.clear()
  }))

  results.push(measure('setAfter1024', () => {
    hashmap1024.set(key, value)
  }, () => {
    hashmap1024.delete(key)
    key = makeid(16)
    value = makeid(128)
  }))

  let keys20b: string[] = []
  let values20b: string[] = []
  for (let n = 0; n < 20; n++) {
    keys20b.push(makeid(16))
    values20b.push(makeid(128))
  }

  results.push(measure('set20After1024', () => {
    for (let m = 0; m < 20; m++) {
      hashmap1024.set(keys20b[m], values20b[m])
    }
  }, () => {
    if (keys20b.length) {
      for (let p = 0; p < 20; p++) {
        hashmap1024.delete(keys20b[p])
      }
    }
    keys20b = []
    values20b = []
    for (let q = 0; q < 20; q++) {
      keys20b.push(makeid(16))
      values20b.push(makeid(128))
    }
  }))

  results.push(measure('getAfter1024', () => {
    hashmap1024.get(key)
  }, () => {
    hashmap1024.delete(key)
    key = makeid(16)
    value = makeid(128)
    hashmap1024.set(key, value)
  }))

  results.push(measure('forEach1024', () => {
    hashmap1024.forEach(() => {})
  }))

  results.push(measure('keys1024', () => {
    hashmap1024.keys()
  }))

  results.push(measure('values1024', () => {
    hashmap1024.values()
  }))

  results.push(measure('entries1024', () => {
    hashmap1024.entries()
  }))

  results.push(measure('clone1024', () => {
    hashmap1024.clone()
  }))

  results.push(measure('copy1024', () => {
    const target = new HashMap()
    target.copy(hashmap1024)
  }))

  results.push(measure('clear1024', () => {
    hashmap1024.clear()
    hashmap1024 = buildPrefilled(1024)
  }))

  results.push(measure('setAfter131072', () => {
    hashmap131072.set(key, value)
  }, () => {
    hashmap131072.delete(key)
    key = makeid(16)
    value = makeid(128)
  }))

  let keys20c: string[] = []
  let values20c: string[] = []
  for (let r = 0; r < 20; r++) {
    keys20c.push(makeid(16))
    values20c.push(makeid(128))
  }

  results.push(measure('set20After131072', () => {
    for (let s = 0; s < 20; s++) {
      hashmap131072.set(keys20c[s], values20c[s])
    }
  }, () => {
    if (keys20c.length) {
      for (let t = 0; t < 20; t++) {
        hashmap131072.delete(keys20c[t])
      }
    }
    keys20c = []
    values20c = []
    for (let u = 0; u < 20; u++) {
      keys20c.push(makeid(16))
      values20c.push(makeid(128))
    }
  }))

  return results
}

function formatOps(ops: number) {
  if (ops >= 1e6) {
    return (ops / 1e6).toFixed(1) + 'M'
  }
  if (ops >= 1e3) {
    return (ops / 1e3).toFixed(0) + 'K'
  }
  return ops.toFixed(0)
}

function loadReport(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function printComparison(current: { version: string, benchmarks: Record<string, { opsPerSec: number }> }, baseline: { version: string, benchmarks: Record<string, { opsPerSec: number }> }, baselinePath: string) {
  const names = Object.keys(current.benchmarks)
  const rows = []
  let wins = 0
  let losses = 0

  for (const name of names) {
    const cur = current.benchmarks[name]
    const base = baseline.benchmarks[name]
    if (!base) {
      continue
    }
    const ratio = cur.opsPerSec / base.opsPerSec
    if (ratio >= 1) {
      wins++
    } else {
      losses++
    }
    rows.push({ name, baseOps: base.opsPerSec, curOps: cur.opsPerSec, ratio })
  }

  const baseLabel = baseline.version + ' @ ' + path.basename(baselinePath)
  const curLabel = current.version + ' (now)'

  console.log('')
  console.log('compare ' + baseLabel + ' → ' + curLabel)
  console.log('name                 base    current   ratio')
  for (const row of rows) {
    const arrow = row.ratio >= 1 ? '↑' : '↓'
    console.log(
      row.name.padEnd(20) +
      formatOps(row.baseOps).padStart(7) +
      formatOps(row.curOps).padStart(9) +
      (row.ratio.toFixed(2) + '×' + arrow).padStart(9),
    )
  }
  console.log('summary: ' + wins + ' faster, ' + losses + ' slower')
}

const benchmarks = runBenchmarks()
const report = {
  version: pkg.version,
  node: process.version,
  timestamp: new Date().toISOString(),
  minMs: MIN_MS,
  benchmarks: {} as Record<string, { ops: number, elapsedMs: number, opsPerSec: number, msPerOp: number }>,
}

for (const result of benchmarks) {
  report.benchmarks[result.name] = {
    ops: result.ops,
    elapsedMs: result.elapsedMs,
    opsPerSec: result.opsPerSec,
    msPerOp: result.msPerOp,
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n')

console.log('Wrote benchmark report to ' + outputPath)
for (const name of Object.keys(report.benchmarks)) {
  const bench = report.benchmarks[name]
  console.log(name + ': ' + bench.opsPerSec.toFixed(0) + ' ops/sec')
}

if (comparePath) {
  printComparison(report, loadReport(comparePath), comparePath)
}
