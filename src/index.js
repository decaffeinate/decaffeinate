import MagicString from 'magic-string';
import addVariableDeclarations from 'add-variable-declarations';
import { linter } from 'eslint';
import { logger } from './utils/debug.js';
import { makePatcher } from './stages/main/index.js';
import parse from './utils/parse.js';

export { default as run } from './cli';

let log = logger('convert');

/**
 * Decaffeinate CoffeeScript source code by adding optional punctuation.
 */
export function convert(source: string): string {
  let ast = parse(source);
  let editor = new MagicString(source);

  try {
    makePatcher(ast, ast.context, editor).patch();
  } catch (err) {
    // FIXME: instanceof would be nice
    // http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node
    if (err.patcher) {
      let { line, column } = err.patcher.context.lineMap.invert(err.start);
      log(`Failed to patch ${err.patcher.node.type} at ${line + 1}:${column + 1}`);
    }
    throw err;
  }

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

