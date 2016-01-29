import Scope from './Scope';
import buildLineAndColumnMap from './buildLineAndColumnMap';
import findCounterpartCharacter from './findCounterpartCharacter';
import isExpressionResultUsed from './isExpressionResultUsed';
import traverse from './traverse';
import wantsToBeStatement from './wantsToBeStatement';
import { isBinaryOperator, isConditional, isFunctionBody, isShorthandThisObjectMember } from './types';
import { parse as coffeeScriptParse } from 'decaffeinate-parser';

/**
 * Parses a CoffeeScript program and cleans up and annotates the AST.
 *
 * @param {string} source
 * @returns {Object} An AST from CoffeeScriptRedux with `scope` and `parentNode`.
 */
export default function parse(source) {
  const ast = coffeeScriptParse(source);
  const map = buildLineAndColumnMap(source);

  traverse(ast, node => {
    attachMetadata(node, source);
    attachScope(node);
    fixRange(node, map, source);
  });

  return ast;
}

/**
 * @param {Object} node
 * @param {string} source
 * @private
 */
function attachMetadata(node, source) {
  // CoffeeScriptRedux parses `unless a` as a `Conditional` with a
  // `UnaryNegateOp` condition, but we want to easily distinguish that case from
  // `if !a`, so we mark `unless` specifically and remove the `UnaryNegateOp`.
  if (isConditional(node) && source.slice(node.range[0], node.range[0] + 'unless'.length) === 'unless') {
    node.condition = node.condition.expression;
    node.isUnless = true;
  }

  if (isConditional(node) && isFunctionBody(node)) {
    // This conditional is a single-line function that wants to be a statement.
    node._expression = !wantsToBeStatement(node);
  } else if (isConditional(node) && isExpressionResultUsed(node)) {
    // This conditional is used in an expression context, e.g. `a(if b then c)`.
    node._expression = true;
  }
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
    if (fixBinaryOperator(node, source)) {
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
    } else if (node.type === 'LogicalNotOp' && node.parentNode.type === 'LogicalNotOp') {
      const { parentNode } = node;
      if (parentNode.raw[0] === '!') {
        node.range = [parentNode.range[0] + '!'.length, parentNode.range[1]];
      } else if (parentNode.raw.slice(0, 'not'.length) === 'not') {
        node.range = [parentNode.range[0] + 'not '.length, parentNode.range[1]];
      } else {
        throw new Error(`BUG: ${parentNode.type} does not start with \`!\` or \`not\`: ${parentNode.raw}`);
      }
      node.raw = source.slice(...node.range);
      node.line = node.expression.line;
      node.column = node.expression.column + (node.range[0] - node.expression.range[0]);
    } else if (fixShorthandThisObjectMember(node)) {
      return;
    } else {
      throw new Error(
        `BUG! Could not fix range for ${node.type}` +
        ` because it has no raw value`
      );
    }
  }
  const fixed = map.getOffset(node.line - 1, node.column - 1);
  for (let slide = 0; slide < 3; slide++) {
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
      `BUG! Could not fix range for ${node.type}` +
      ` at line ${node.line}, column ${node.column}`
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
 * @param {string} source
 * @returns {boolean}
 * @private
 */
function fixBinaryOperator(node, source) {
  if (!isBinaryOperator(node)) {
    return false;
  }

  const { left, right } = node;

  fixBinaryOperator(left, source);
  fixBinaryOperator(right, source);

  if (!node.range) {
    node.range = [left.range[0], right.range[1]];
  }

  node.raw = source.slice(node.range[0], node.range[1]);
  node.line = left.line;
  node.column = left.column;

  return true;
}

/**
 * @param {Object} node
 * @returns {boolean}
 */
function fixShorthandThisObjectMember(node) {
  if (node.type !== 'String') {
    return false;
  }

  const { parentNode } = node;

  if (!isShorthandThisObjectMember(parentNode)) {
    return false;
  }

  node.type = 'Identifier';
  node.raw = node.data;
  node.range = [
    parentNode.range[0] + '@'.length,
    parentNode.range[1]
  ];

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
