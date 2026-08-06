/// <reference types="vitest" />
import path from 'path'
import type { Reporter } from 'vitest/reporters'
import type { TestModule } from 'vitest/node'
import { defineConfig } from 'vitest/config'

const APP_NAME = path.basename(process.cwd())

export default defineConfig(() => ({
  cacheDir: `/tmp/${APP_NAME}`,
  resolve: {
    alias: {
      src: path.resolve(process.cwd(), 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'tmp', 'src/utils.test.ts'],
    reporters: process.env.MINIMAL ? [new CompactReporter()] : ['dot'],
    logHeapUsage: false,
    silent: false,
    disableConsoleIntercept: true,
    onStackTrace: () => false,
    pool: 'threads',
    coverage: {
      enabled: false,
    },
    deps: {
      interopDefault: true,
    },
    server: {
      deps: {
        inline: [/^src\//],
      },
    },
  },
  oxc: {
    target: 'node20',
  },
}))

class CompactReporter implements Reporter {
  onTestRunEnd(testModules: ReadonlyArray<TestModule>) {
    let totalTests = 0
    let failedTests = 0
    for (const module of testModules) {
      for (const test of module.children.allTests()) {
        totalTests++
        const result = test.result()
        if (result.state === 'failed') {
          failedTests++
          console.log(`❌ ${test.name}`)
          const err = result.errors?.[0]
          if (err) {
            console.log(`  ${err.message.split('\n')[0]}`)
          }
        }
      }
    }
    console.log(`\n${failedTests > 0 ? '❌' : '✅'} ${totalTests - failedTests} passed, ${failedTests} failed`)
  }
}
