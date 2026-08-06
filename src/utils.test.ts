/** Testing utilities for data-driven test patterns */
/// <reference types="vitest/globals" />
import path from 'node:path'

/** Converts a filename to a module describe() */
export const toModule = (file: string) => {
  return path.relative(process.cwd(), file)
    .replace(/\.test\.[tj]s$/, '')
}

/**
 * Base test case structure for data-driven tests
 * @example const cases: TestCase<string, { name: string, email: string }>[] = []
 */
export type TestCase<I = any, O = any> = {
  /** Description of what this test case is testing */
  desc: string
  /** Input to the function being tested */
  input: I
} & (
  /** Expected output from the function */
  | { expected: O, throws?: never }
  /** If it throws, provide the error message and don't expect an output */
  | { throws: string, expected?: never }
)

/**
 * Type helper to create a TestCase from a function signature
 * For multi-arg functions, input must be an array of args (input: [value])
 * For single-arg functions, use input: value
 * If the only arg is optional, use input: [value]
 * @example const cases: FnTestCase<typeof filter.merge>[] = []
 */
export type FnTestCase<Fn extends (...args: any[]) => any> = Parameters<Fn> extends [infer SingleArg] | [infer SingleArg | undefined] ? TestCase<SingleArg, ReturnType<Fn>> : TestCase<Parameters<Fn>, ReturnType<Fn>>

export type FnSingleTestCase<Fn extends (...args: any[]) => any> = TestCase<Parameters<Fn>[0], ReturnType<Fn>>

/** Run data-driven cases against a function, cases type inferred from `fn` when inlined. */
export const runTestCases = <Fn extends (...args: any[]) => any>(fn: Fn, cases: FnTestCase<Fn>[]): void => {
  cases.forEach((testCase) => {
    it(`should handle ${testCase.desc}`, () => {
      if ('throws' in testCase) {
        expect(() => invokeFn(fn, testCase)).to.throw(testCase.throws)
      } else {
        expect(invokeFn(fn, testCase)).to.eql(testCase.expected)
      }
    })
  })
}

const invokeFn = <Fn extends (...args: any[]) => any>(fn: Fn, testCase: FnTestCase<Fn>): ReturnType<Fn> => {
  const { input } = testCase
  if (fn.length > 1 && Array.isArray(input)) {
    return fn(...(input as Parameters<Fn>))
  }
  return fn(input as Parameters<Fn>[0])
}
