import MagicString from 'magic-string';
import MainStage from './stages/main/index.js';
import NormalizeStage from './stages/normalize/index.js';
import addVariableDeclarations from 'add-variable-declarations';
import parse from './utils/parse.js';
import type Stage from './stages/Stage.js';
import { linter } from 'eslint';
import { logger } from './utils/debug.js';

export { default as run } from './cli';

let log = logger('convert');

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 */
export function convert(source: string): string {
  let normalized = patch(source, NormalizeStage).code;
  let js = patch(normalized, MainStage).code;
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

function patch(source: string, StageClass: Class<Stage>): { code: string, map: Object } {
  let ast = parse(source);
  let editor = new MagicString(source);
  let stage = new StageClass(ast, ast.context, editor);
  let patcher = stage.build();
  patcher.patch();
  return { code: editor.toString(), map: editor.generateMap() };
}

