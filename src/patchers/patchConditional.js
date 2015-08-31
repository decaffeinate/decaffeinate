import appendClosingBrace from '../utils/appendClosingBrace';
import getIndent from '../utils/getIndent';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isSurroundedBy from '../utils/isSurroundedBy';
import replaceBetween from '../utils/replaceBetween';
import requiresParentheses from '../utils/requiresParentheses';
import trimmedNodeRange from '../utils/trimmedNodeRange';

const UNLESS = 'unless';

/**
 * Adds punctuation to `if` statements and converts `if` expressions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchConditionalStart(node, patcher) {
  if (node.type === 'Conditional' && isExpressionResultUsed(node)) {
    // i.e. remove "if" or "unless"
    patcher.overwrite(node.range[0], node.condition.range[0], '');
  } else if (isUnlessConditional(node, patcher.original)) {
    patcher.overwrite(node.range[0], node.range[0] + UNLESS.length, 'if');
  } else if (isCondition(node) && isExpressionResultUsed(node.parentNode)) {
    // nothing to do
    return;
  } else if (isCondition(node)) {
    const isSurroundedByParens = isSurroundedBy(node, '(', patcher.original);
    const isUnless = isUnlessConditional(node.parentNode, patcher.original);
    let inserted = '';
    let offset = node.range[0];

    if (isUnless) {
      let conditionNeedsParens = requiresParentheses(node.expression);
      if (conditionNeedsParens) {
        if (isSurroundedByParens) {
          // e.g. `unless (a + b)` -> `if (!(a + b)) {`
          inserted += '!(';
        } else {
          // e.g. `unless a + b` -> `if (!(a + b)) {`
          inserted += '(!(';
        }
      } else {
        if (isSurroundedByParens) {
          // e.g. `unless (a)` -> `if (!a) {`
          inserted += '!';
        } else {
          // e.g. `unless a` -> `if (!a) {`
          inserted += '(!';
        }
      }
    } else if (isSurroundedByParens) {
      // e.g. `if (a)` -> `if (a) {`
      inserted = '';
    } else {
      // e.g. `if a` -> `if (a) {`
      inserted += '(';
    }

    patcher.insert(offset, inserted);
  }
}

/**
 * Adds punctuation to `if` statements and converts `if` expressions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchConditionalEnd(node, patcher) {
  if (isCondition(node)) {
    if (isExpressionResultUsed(node.parentNode)) {
      replaceBetween(patcher, node, node.parentNode.consequent, 'then', '?');
    } else {
      if (!replaceBetween(patcher, node, node.parentNode.consequent, 'then ', '')) {
        replaceBetween(patcher, node, node.parentNode.consequent, 'then', '');
      }
      let parens = isSurroundedBy(node, '(', patcher.original);
      let inserted = parens ? ' {' : ') {';
      if (isUnlessConditional(node.parentNode, patcher.original) && requiresParentheses(node.expression)) {
        inserted = `)${inserted}`;
      }
      let nodeRange = trimmedNodeRange(node, patcher.original);
      patcher.insert(nodeRange[1] + (parens ? ')'.length : 0), inserted);
    }
  } else if (isConsequent(node)) {
    if (isExpressionResultUsed(node.parentNode)) {
      if (node.parentNode.alternate) {
        // e.g. `a(if b then c else d)` -> `a(b ? c : d)`
        //                     ^^^^                 ^
        replaceBetween(patcher, node, node.parentNode.alternate, 'else', ':');
      } else {
        // e.g. `a(if b then c)` -> `a(b ? c : undefined)
        //                                  ^^^^^^^^^^^^
        let nodeRange = trimmedNodeRange(node, patcher.original);
        patcher.insert(nodeRange[1], ' : undefined');
      }
    } else if (node.parentNode.alternate) {
      // Only add the opening curly for the alternate if it is not a conditional,
      // otherwise the handler for the end of its condition will add it.
      replaceBetween(
        patcher,
        node,
        node.parentNode.alternate,
        'else',
        `} else${node.parentNode.alternate.type === 'Conditional' ? '' : ' {'}`
      );
    }
  } else if (node.type === 'Conditional' && (!node.alternate || node.alternate.type !== 'Conditional')) {
    if (!isExpressionResultUsed(node)) {
      // Close the conditional if it isn't handled by closing an `else if`.
      if (isOneLineConditionAndConsequent(node, patcher.original)) {
        let nodeRange = trimmedNodeRange(node, patcher.original);
        patcher.insert(nodeRange[1], ' }');
      } else {
        appendClosingBrace(node, patcher);
      }
    }
  }
}

/**
 * Determines whether a node is a Conditional node's condition.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isCondition(node) {
  return node.parentNode ? node.parentNode.type === 'Conditional' && node.parentNode.condition === node : false;
}

/**
 * @param {Object} node
 * @param {string} source
 * @returns {boolean}
 */
function isUnlessConditional(node, source) {
  return node.type === 'Conditional' && source.slice(node.range[0], node.range[0] + UNLESS.length) === UNLESS;
}

/**
 * Determines whether a node is a Conditional node's consequent.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isConsequent(node) {
  return node.parentNode ? node.parentNode.type === 'Conditional' && node.parentNode.consequent === node : false;
}

/**
 * Determines whether the condition and consequent are on the same line.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isOneLineConditionAndConsequent(node, source) {
  let condition = node.condition;
  let consequent = node.consequent;

  if (isUnlessConditional(node, source)) {
    condition = condition.expression;
  }

  return condition.line === consequent.line;
}
