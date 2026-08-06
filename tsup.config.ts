import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { hashmap: 'src/hashmap.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'HashMap',
  platform: 'neutral',
  target: 'es2020',
  outDir: 'dist',
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: true,
  async onSuccess() {
    const { readFileSync, writeFileSync } = await import('node:fs')
    const { join } = await import('node:path')

    const cjsFile = join('dist', 'hashmap.cjs')
    const cjsPatch = ';{const h=module.exports.default||module.exports.HashMap;if(typeof h==="function"){h.HashMap=h;module.exports=h;}}'
    const cjs = readFileSync(cjsFile, 'utf8')
    if (!cjs.endsWith(cjsPatch)) {
      writeFileSync(cjsFile, cjs + cjsPatch)
    }

    const iifeFile = join('dist', 'hashmap.iife.js')
    const iifePatch = ';HashMap=HashMap.default||HashMap.HashMap||HashMap;'
    const iife = readFileSync(iifeFile, 'utf8')
    if (!iife.endsWith(iifePatch)) {
      writeFileSync(iifeFile, iife + iifePatch)
    }
  },
  outExtension({ format }) {
    if (format === 'cjs') {
      return { js: '.cjs' }
    }
    if (format === 'iife') {
      return { js: '.iife.js' }
    }
    return { js: '.js' }
  },
})
