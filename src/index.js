import MagicString from 'magic-string';
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
    editor = new MagicString(js);
    let messages = linter.verify(js, { rules: { semi: 2 } });
    messages.forEach(message => {
      if (message.ruleId === 'semi') {
        editor.insert(message.fix.range[1], message.fix.text);
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
