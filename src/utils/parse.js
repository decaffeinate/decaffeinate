import Scope from './Scope';
import buildLineAndColumnMap from './buildLineAndColumnMap';
import findCounterpartCharacter from './findCounterpartCharacter';
import traverse from './traverse';
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

  if (!('raw' in node)) {
    if (node.parentNode && node.parentNode.type === 'While' && node.parentNode.condition === node) {
      // Ignore `while` condition without raw
      return;
    } else if ( ['LogicalAndOp','NEQOp','MultiplyOp','PlusOp'].indexOf(node.type)!==-1  && node.left) {
      if (node.left.raw) {
        node.raw = node.left.raw;
        node.range = node.left.range;
        node.line = node.left.line;
        node.column = node.left.column;
      }
      else {
        node.raw = node.parentNode.raw;
        node.range = node.parentNode.range;
        node.line = node.parentNode.line;
        node.column = node.parentNode.column;
      }
    } else if (node.type === 'Block' && node.parentNode && node.parentNode.type === 'Try') {
      // Ignore missing blocks in try/catch
      return;
    } else if (node.type === 'LogicalNotOp' && node.parentNode.type === 'Conditional' && node.parentNode.condition === node) {
      node.raw = node.expression.raw;
      node.range = node.expression.range;
      node.line = node.expression.line;
      node.column = node.expression.column;
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

  if (!node.range || node.raw !== source.slice(node.range[0], node.range[1])) {
    if (node.parentNode && node.parentNode.step === node) {
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
