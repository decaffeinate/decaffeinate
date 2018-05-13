import * as babel from 'babel-core';
import { compile as cs1Compile } from 'decaffeinate-coffeescript';
import { compile as cs2Compile } from 'decaffeinate-coffeescript2';
import * as vm from 'vm';
import { convert } from '../../src/index';
import { Options } from '../../src/options';
import PatchError from '../../src/utils/PatchError';
import assertDeepEqual from './assertDeepEqual';

export type ValidateOptions = {
  options?: Options;
  // If we generate syntax not supported by node, don't try running the
  // resulting JS there directly.
  skipNodeCheck?: boolean;
};

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
 * Optionally, expectedOutput can be specified. If it is, the the result of the
 * 'o' variable must be equal to that value.
 */
export default function validate(
  source: string,
  // tslint:disable-next-line:no-any
  expectedOutput?: any | { cs1: any; cs2: any },
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  let expectedCS1 = expectedOutput && expectedOutput.hasOwnProperty('cs1') ? expectedOutput.cs1 : expectedOutput;
  let expectedCS2 = expectedOutput && expectedOutput.hasOwnProperty('cs2') ? expectedOutput.cs2 : expectedOutput;
  runValidateCase(source, expectedCS1, { options: { ...options, useCS2: false }, skipNodeCheck });
  runValidateCase(source, expectedCS2, { options: { ...options, useCS2: true }, skipNodeCheck });
}

export function validateCS1(
  source: string,
  // tslint:disable-next-line:no-any
  expectedOutput?: any,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  runValidateCase(source, expectedOutput, { options: { ...options, useCS2: false }, skipNodeCheck });
}

export function validateCS2(
  source: string,
  // tslint:disable-next-line:no-any
  expectedOutput?: any,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  runValidateCase(source, expectedOutput, { options: { ...options, useCS2: true }, skipNodeCheck });
}

function runValidateCase(
  source: string,
  // tslint:disable-next-line:no-any
  expectedOutput?: any,
  { options = {}, skipNodeCheck = false }: ValidateOptions = {}
): void {
  try {
    runValidation(source, expectedOutput, options, skipNodeCheck);
  } catch (err) {
    if (PatchError.detect(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}

// tslint:disable-next-line:no-any
function runCodeAndExtract(source: string): any {
  let result = null;
  let numCalls = 0;
  let sandbox = {
    // tslint:disable-next-line:no-any
    setResult(r: any): void {
      result = r;
      numCalls++;
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  if (numCalls !== 1) {
    throw new Error(`expected setResult to be called exactly once`);
  }
  return result;
}

function runValidation(source: string, expectedOutput: {}, options: Options, skipNodeCheck: boolean): void {
  let compile = options.useCS2 ? cs2Compile : cs1Compile;
  let coffeeES5 = compile(source, { bare: true }) as string;
  let decaffeinateES6 = convert(source, options).code;
  let decaffeinateES5 =
    babel.transform(decaffeinateES6, {
      presets: ['es2015'],
      plugins: ['transform-optional-chaining']
    }).code || '';

  let coffeeOutput = runCodeAndExtract(coffeeES5);
  let decaffeinateOutput = runCodeAndExtract(decaffeinateES5);
  try {
    assertDeepEqual(decaffeinateOutput, coffeeOutput, 'decaffeinate and coffee output were different.');
  } catch (err) {
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
    let nodeOutput = runCodeAndExtract(decaffeinateES6);
    assertDeepEqual(decaffeinateOutput, nodeOutput, 'babel and node output were different.');
  }

  if (expectedOutput !== undefined) {
    assertDeepEqual(decaffeinateOutput, expectedOutput, 'decaffeinate and expected output were different.');
  }
}
