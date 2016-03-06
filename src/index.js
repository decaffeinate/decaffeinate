import MagicString from 'magic-string';
import addVariableDeclarations from 'add-variable-declarations';
import { linter } from 'eslint';
import { logger } from './utils/debug.js';
import { makePatcher as makeNormalizePatcher } from './stages/normalize/index.js';
import { makePatcher as makeMainPatcher } from './stages/main/index.js';
import parse from './utils/parse.js';
import type NodePatcher from './patchers/NodePatcher.js';
import type { Node, Editor, ParseContext } from './patchers/types.js';

export { default as run } from './cli';

let log = logger('convert');

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 */
export function convert(source: string): string {
  let normalized = patch(source, makeNormalizePatcher).code;
  let js = patch(normalized, makeMainPatcher).code;
  try {
    js = addVariableDeclarations(js).code;
  } catch (err) {
    log(js);
    log(err);
    throw err;
  }

  try {
    let editor = new MagicString(js);
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

function patch(source: string, makePatcher: (ast: Node, context: ParseContext, editor: Editor) => NodePatcher): { code: string, map: Object } {
  let ast = parse(source);
  let editor = new MagicString(source);
  makePatcher(ast, ast.context, editor).patch();
  return { code: editor.toString(), map: editor.generateMap() };
}

