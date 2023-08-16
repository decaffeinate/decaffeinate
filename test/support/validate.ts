import * as babel from '@babel/core';
import assert from 'assert';
import { compile as cs1Compile } from 'decaffeinate-coffeescript';
import { compile as cs2Compile } from 'decaffeinate-coffeescript2';
import * as vm from 'vm';
import { convert } from '../../src/index';
import { Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import assertDeepEqual from './assertDeepEqual';

export interface ValidateOptions {
  options?: Options;
  // If we generate syntax not supported by node, don't try running the
  // resulting JS there directly.
  skipNodeCheck?: boolean;
}

/**
 * validate takes coffee-script as input with code that calls the setResult
 * function. The coffee-script is run through two different transform paths:
 *
 * 1) source input -> coffee-script -> ES5
 * 2) source input -> decaffeinate -> ES6 -> babel -> ES5
 *
 * The ES5 from both paths is run in a sandbox and then the setResult argument
 * from each case is compared. If the output is the same then the test has
 * passed.
 *
 * In addition, on node >= 6, we run the ES6 code directly to make sure it gives
 * the same result, to avoid behavior differences with babel.
 *
 * Optionally, expectedOutput can be specified. If it is, then the result of the
 * 'o' variable must be equal to that value.
 */
export default function validate(
  source: string,
  expectedOutput?: unknown,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  const expectedCS1: unknown =
    expectedOutput && Object.prototype.hasOwnProperty.call(expectedOutput, 'cs1')
      ? (expectedOutput as { cs1: unknown }).cs1
      : expectedOutput;
  const expectedCS2: unknown =
    expectedOutput && Object.prototype.hasOwnProperty.call(expectedOutput, 'cs2')
      ? (expectedOutput as { cs2: unknown }).cs2
      : expectedOutput;
  runValidateCase(source, expectedCS1, { options: { ...options, useCS2: false }, skipNodeCheck });
  runValidateCase(source, expectedCS2, { options: { ...options, useCS2: true }, skipNodeCheck });
}

export function validateCS1(
  source: string,
  expectedOutput?: unknown,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  runValidateCase(source, expectedOutput, { options: { ...options, useCS2: false }, skipNodeCheck });
}

export function validateCS2(
  source: string,
  expectedOutput?: unknown,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  runValidateCase(source, expectedOutput, { options: { ...options, useCS2: true }, skipNodeCheck });
}

function runValidateCase(
  source: string,
  expectedOutput?: unknown,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  try {
    runValidation(source, expectedOutput, options, skipNodeCheck);
  } catch (err: unknown) {
    assert(err instanceof Error);
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}

function runCodeAndExtract(source: string): unknown {
  let result: unknown = null;
  let numCalls = 0;
  const sandbox = {
    setResult(r: unknown): void {
      result = r;
      numCalls++;
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  if (numCalls !== 1) {
    throw new Error(`expected setResult to be called exactly once`);
  }
  return result;
}

function runValidation(source: string, expectedOutput: unknown, options: Options, skipNodeCheck: boolean): void {
  const compile = options.useCS2 ? cs2Compile : cs1Compile;
  const coffeeES5 = compile(source, { bare: true }) as string;
  const decaffeinateES6 = convert(source, options).code;
  const transformed = babel.transformSync(decaffeinateES6, {
    presets: ['@babel/preset-env'],
  });
  const decaffeinateES5 = (transformed && transformed.code) || '';

  const coffeeOutput = runCodeAndExtract(coffeeES5);
  const decaffeinateOutput = runCodeAndExtract(decaffeinateES5);
  try {
    assertDeepEqual(decaffeinateOutput, coffeeOutput, 'decaffeinate and coffee output were different.');
  } catch (err: unknown) {
    assert(err instanceof Error);
    // add some additional context for debugging
    err.message = `Additional Debug:
SOURCE
${source}
********************
INPUT -> COFFEE-SCRIPT -> ES5
${coffeeES5}
********************
INPUT -> DECAFFEINATE -> ES6
${decaffeinateES6}
********************
INPUT -> DECAFFEINATE -> ES6 -> BABEL -> ES5
${decaffeinateES5}
********************
COFFEE-SCRIPT ES5 compared to DECAFFEINATE/BABEL ES5
${err.message}`;
    throw err;
  }

  // Make sure babel and V8 behave the same if we're on node >= 6.
  if (!skipNodeCheck) {
    const nodeOutput = runCodeAndExtract(decaffeinateES6);
    assertDeepEqual(decaffeinateOutput, nodeOutput, 'babel and node output were different.');
  }

  if (expectedOutput !== undefined) {
    assertDeepEqual(decaffeinateOutput, expectedOutput, 'decaffeinate and expected output were different.');
  }
}
