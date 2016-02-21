import MagicString from 'magic-string';
import Scope from './utils/Scope.js';
import addVariableDeclarations from 'add-variable-declarations';
import traverse from './utils/traverse.js';
import type { Node } from './patchers/types.js';
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

  traverse(ast, attachScope);

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

function attachScope(node: Node) {
  switch (node.type) {
    case 'Program':
      node.scope = new Scope();
      break;

    case 'Function':
    case 'BoundFunction':
      node.scope = new Scope(node.parentNode.scope);
      break;

    default:
      node.scope = node.parentNode.scope;
      break;
  }

  node.scope.processNode(node);
}
