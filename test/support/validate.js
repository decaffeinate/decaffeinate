import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';
//import stripSharedIndent from '../../src/utils/stripSharedIndent.js';
import PatchError from '../../src/utils/PatchError.js';
import coffee from 'coffee-script';
import * as babel from 'babel-core';
import * as vm from 'vm';

/*
 * validate takes a string that contains a CoffeeScript function as input. It*
 * runs this string through two code paths and compares the final output.
 *
 * The first path is through the main coffee script compiler, the second
 * path is through decaffeinate, and then babel. The both functions are
 * then eval'ed and the output compared.
 *
 * e.g
 * validate(
 * `->
 *   return "this is the string I want to validate"
 * `);
 *
 */
export default function validate(source) {
  try {
    runValidation(source);
  } catch (err) {
    if (PatchError.isA(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    console.error('validate input source:\n', source);
    throw err;
  }
}

function runValidation(source) {
  let  decaffeinateES6 = convert(source);
  decaffeinateES6 = decaffeinateES6.code;

  let decaffeinateES5 = babel.transform(decaffeinateES6, {presets: ['es2015']}).code;

  let coffeeOutput = coffee.eval(source);
  let sandbox = {};
  vm.createContext(sandbox);
  let decaffeinateOutput = vm.runInContext(decaffeinateES5, sandbox);
  if (typeof coffeeOutput != 'function') {
    throw new Error('validate could not convert source via coffee-script compiler to a function');
  }
  if (typeof decaffeinateOutput != 'function') {
    throw new Error('validate could not convert source via decaffeinate + babel to a function');
  }

  coffeeOutput = coffeeOutput();
  decaffeinateOutput = decaffeinateOutput();

  strictEqual(typeof coffeeOutput, 'string');
  strictEqual(typeof decaffeinateOutput, 'string');
  strictEqual(coffeeOutput, decaffeinateOutput);
}
