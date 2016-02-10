import MagicString from 'magic-string';
import addVariableDeclarations from 'add-variable-declarations';
import { linter } from 'eslint';
import { logger } from './utils/debug';
import { makePatcher } from './patchers/index.js';
import { parse } from 'decaffeinate-parser';

export { default as run } from './cli';

const log = logger('convert');

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 *
 * @param source
 * @returns {string}
 */
export function convert(source) {
  let ast = parse(source);
  let editor = new MagicString(source);

  makePatcher(ast, ast.context, editor).patch();
  let js = editor.toString();
  try {
    js = addVariableDeclarations(js).code;
  } catch (err) {
    log(js);
    log(err);
    throw err;
  }
  try {
    editor = new MagicString(js);
    let messages = linter.verify(js, {
      rules: { 'semi': 2, 'no-extra-semi': 2 },
      env: { es6: true }
    });
    messages.forEach(message => {
      switch (message.ruleId) {
        case 'semi':
          editor.insert(message.fix.range[1], message.fix.text);
          break;

        case 'no-extra-semi':
          editor.overwrite(...message.fix.range, message.fix.text);
          break;
      }
    });
    js = editor.toString();
  } catch (err) {
    log(js);
    log(err);
    throw err;
  }
  return js;
}
