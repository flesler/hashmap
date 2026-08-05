import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { hashmap: 'src/index.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'HashMap',
  platform: 'neutral',
  target: 'es2020',
  outDir: 'dist',
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
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
