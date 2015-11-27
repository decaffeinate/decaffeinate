import Scope from './Scope';
import buildLineAndColumnMap from './buildLineAndColumnMap';
import findCounterpartCharacter from './findCounterpartCharacter';
import traverse from './traverse';
import { isBinaryOperator } from './types';
import { parse as coffeeScriptParse } from 'coffee-script-redux';

/**
 * Parses a CoffeeScript program and cleans up and annotates the AST.
 *
 * @param {string} source
 * @returns {Object} An AST from CoffeeScriptRedux with `scope` and `parentNode`.
 */
export default function parse(source) {
  const ast = coffeeScriptParse(source, { raw: true }).toBasicObject();
  const map = buildLineAndColumnMap(source);

  traverse(ast, function(node) {
    attachScope(node);
    fixRange(node, map, source);
  });

  return ast;
}

/**
 * @param {Object} node
 * @private
 */
function attachScope(node) {
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

/**
 * @param {Object} node
 * @param {LineAndColumnMap} map
 * @param {string} source
 * @private
 */
function fixRange(node, map, source) {
  if (!node.range && node.type === 'ConcatOp') { return; }

  const { parentNode } = node;

  if (!rawMatchesRange(node, source) && node.type === 'MemberAccessOp' && parentNode.type === 'FunctionApplication') {
    let firstArgument = parentNode.arguments[0];
    let startOfArguments = firstArgument ? firstArgument.range[0] - '('.length : parentNode.range[1] - '()'.length;
    node.raw = parentNode.raw.slice(0, startOfArguments - parentNode.range[0]);
    node.range = [parentNode.range[0], startOfArguments];
  }

  if (!('raw' in node)) {
    if (fixBinaryOperator(node, map, source)) {
      return;
    } else if (parentNode && parentNode.type === 'While' && parentNode.condition === node) {
      // Ignore `while` condition without raw
      return;
    } else if (node.type === 'Block' && parentNode && parentNode.type === 'Try') {
      // Ignore missing blocks in try/catch
      return;
    } else if (node.type === 'LogicalNotOp' && parentNode.type === 'Conditional' && parentNode.condition === node) {
      node.raw = node.expression.raw;
      node.range = node.expression.range;
      node.line = node.expression.line;
      node.column = node.expression.column;
    } else if (node.type === 'LogicalNotOp' && node.expression && node.expression.type === 'InOp') {
      // Ignore `not` operator within `in` operator
      return;
    } else {
      throw new Error(
        'BUG! Could not fix range for ' + node.type +
        ' because it has no raw value'
      );
    }
  }
  const fixed = map.getOffset(node.line - 1, node.column - 1);
  for (var slide = 0; slide < 3; slide++) {
    if (source.slice(fixed - slide, fixed - slide + node.raw.length) === node.raw) {
      node.range = [fixed - slide, fixed - slide + node.raw.length];
      break;
    }
  }

  if (!rawMatchesRange(node, source)) {
    if (parentNode && parentNode.step === node) {
      // Ignore invalid `step` parameters, they're auto-generated if left out.
      return;
    }

    if (shrinkPastParentheses(node, map, source, false)) {
      return;
    }

    throw new Error(
      'BUG! Could not fix range for ' + node.type +
      ' at line ' + node.line + ', column ' + node.column
    );
  } else {
    shrinkPastParentheses(node, map, source, true);
  }
}

/**
 * Determines whether the `raw` source reported for the node matches the section
 * of the original source the node's reported `range` describes.
 *
 * @param {Object} node
 * @param {string} source
 * @returns {boolean}
 */
function rawMatchesRange(node, source) {
  return node.range && node.raw === source.slice(node.range[0], node.range[1]);
}

/**
 * @param {Object} node
 * @param {LineAndColumnMap} map
 * @param {string} source
 * @returns {boolean}
 * @private
 */
function fixBinaryOperator(node, map, source) {
  if (!isBinaryOperator(node)) {
    return false;
  }

  const { left, right } = node;

  fixBinaryOperator(left, map, source);
  fixBinaryOperator(right, map, source);

  if (!node.range) {
    node.range = [left.range[0], right.range[1]];
  }

  node.raw = source.slice(node.range[0], node.range[1]);
  node.line = left.line;
  node.column = left.column;

  return true;
}

/**
 * Work around a bug with parentheses.
 *
 * Sometimes parentheses end up as part of a node's raw value even though they
 * probably shouldn't, like with `if (ref = a) then b else c`, the node for the
 * assignment has a raw value of "(ref = a)".
 *
 * @param {Object} node
 * @param {LineAndColumnMap} map
 * @param {string} source
 * @param {boolean} adjustPosition
 * @returns {boolean}
 */
function shrinkPastParentheses(node, map, source, adjustPosition) {
  if (node.raw[0] === '(') {
    let counterpart = findCounterpartCharacter('(', node.raw);
    if (counterpart === node.raw.length - 1) {
      node.raw = node.raw.slice(1, -1);
      if (adjustPosition) {
        node.range = [node.range[0] + 1, node.range[1] - 1];
        node.column -= 1;
      }
      fixRange(node, map, source);
      return true;
    }
  }

  return false;
}
