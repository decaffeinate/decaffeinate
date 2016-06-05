import { convert } from '../../dist/decaffeinate.cjs.js';
import { strictEqual } from 'assert';
import PatchError from '../../src/utils/PatchError.js';
import coffee from 'coffee-script';
import * as babel from 'babel-core';
import * as vm from 'vm';

/*
 * validate takes coffee-script as input with code that sets the variable
 * 'o'. The coffee-script is run through two different transform paths:
 * 
 * 1) source input -> coffee-script -> ES5
 * 2) source input -> decaffeinate -> ES6 -> babel -> ES5
 * 
 * The ES5 from both paths is run in a sandbox and then the 'o' variable
 * from the scope of each sandbox is compared. If the output is the same
 * then the test has passed.
 */
export default function validate(source) {
  try {
    runValidation(source);
  } catch (err) {
    if (PatchError.isA(err)) {
      console.error(PatchError.prettyPrint(err));
    }
    throw err;
  }
}

function runCodeAndExtract(source) {
  let sandbox = {o: null};
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox); 
  return sandbox.o;
}

function runValidation(source) {
  let coffeeES5 = coffee.compile(source, {bare: true});
  let decaffeinateES6 = convert(source).code;
  let decaffeinateES5 = babel.transform(decaffeinateES6, {presets: ['es2015']}).code;

  let coffeeOutput = runCodeAndExtract(coffeeES5);
  let decaffeinateOutput = runCodeAndExtract(decaffeinateES5);
  try { 
    strictEqual(decaffeinateOutput, coffeeOutput);
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
}
