import MagicString from 'magic-string';
import { makePatcher } from './patchers/index.js';
import { parse } from 'decaffeinate-parser';

export { default as run } from './cli';

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

  return editor.toString();
}
