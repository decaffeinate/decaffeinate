import { escapeTemplateStringContents } from '../utils/escape';
import replaceTripleQuotes from '../utils/replaceTripleQuotes';

/**
 * Replaces string interpolation with template strings.
 *
 * @example
 *
 *   "a#{b}c"  ->  `a${b}c`
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchStringInterpolation(node, patcher) {
  if (node.type === 'ConcatOp') {
    if (node.parentNode.type !== 'ConcatOp') {
      if (node.raw.slice(0, 3) === '"""') {
        replaceTripleQuotes(node, patcher);
      } else {
        patcher.overwrite(node.range[0], node.range[0] + 1, '`');
        patcher.overwrite(node.range[1] - 1, node.range[1], '`');
      }
    }
    patchInterpolation(node.left, patcher);
    patchInterpolation(node.right, patcher);
  } else if (node.type === 'String' && node.parentNode.type === 'ConcatOp') {
    escapeTemplateStringContents(patcher, node.range[0], node.range[1]);
  }
}

/**
 * Patches the interpolation surrounding a node, if it is an interpolated value.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @private
 */
function patchInterpolation(node, patcher) {
  switch (node.type) {
    case 'String':
    case 'ConcatOp':
      return;
  }

  const interpolationStart = findInterpolationStart(node, patcher.original);

  if (interpolationStart < 0) {
    throw new Error(
      `unable to find interpolation start, i.e. "#{", before ${node.type}` +
      ` at line ${node.line}, column ${node.column}`
    );
  }

  patcher.overwrite(interpolationStart, interpolationStart + 1, '$');
}

/**
 * Find the start of the interpolation that contains an expression.
 *
 * @param {Object} expression
 * @param {string} source
 * @returns {number}
 * @private
 */
function findInterpolationStart(expression, source) {
  let index = expression.range[0] - 2;

  while (index >= 0) {
    if (source.slice(index, index + '#{'.length) === '#{') {
      break;
    }

    index--;
  }

  return index;
}
