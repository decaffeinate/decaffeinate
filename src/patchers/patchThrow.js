const LPAREN = '(';
const RPAREN = ')';

/**
 * Wraps throw expressions in an IIFE.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchThrowStart(node, patcher) {
  if (isThrowExpression(node)) {
    let pos = node.range[0];
    let str = '() => { ';
    if (patcher.slice(pos - LPAREN.length, pos) !== LPAREN) {
      // Doesn't start with a parenthesis, so add it to the start.
      str += LPAREN;
    }
    patcher.insert(pos, str);
  }
}

/**
 * Wraps throw expressions in an IIFE.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchThrowEnd(node, patcher) {
  if (isThrowExpression(node)) {
    let pos = node.range[1];
    let str = '; })(';
    if (patcher.slice(pos, pos + RPAREN.length) !== RPAREN) {
      // Doesn't end with a parenthesis, so add it to the end.
      str += RPAREN;
    }
    patcher.insert(pos, str);
  }
}

/**
 * Determines whether a node is a `throw` used in an expression context.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isThrowExpression(node) {
  return node.type === 'Throw' && node.parentNode.type !== 'Block';
}
