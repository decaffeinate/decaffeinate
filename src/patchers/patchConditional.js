import getIndent from '../utils/getIndent';
import isExpressionResultUsed from '../utils/isExpressionResultUsed';
import isSurroundedBy from '../utils/isSurroundedBy';
import replaceBetween from '../utils/replaceBetween';
import requiresParentheses from '../utils/requiresParentheses';
import sourceBetween from '../utils/sourceBetween';

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
    patcher.replace(node.range[0], node.condition.range[0], '');
  } else if (isUnlessConditional(node, patcher.original)) {
    patcher.replace(node.range[0], node.range[0] + UNLESS.length, 'if');
  } else if (isCondition(node) && isExpressionResultUsed(node.parent)) {
    // nothing to do
  } else if (isCondition(node)) {
    const isSurroundedByParens = isSurroundedBy(node, '(', patcher.original);
    const isUnless = isUnlessConditional(node.parent, patcher.original);
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
    if (isExpressionResultUsed(node.parent)) {
      replaceBetween(patcher, node, node.parent.consequent, 'then', '?');
    } else {
      replaceBetween(patcher, node, node.parent.consequent, 'then ', '') ||
      replaceBetween(patcher, node, node.parent.consequent, 'then', '');
      let parens = isSurroundedBy(node, '(', patcher.original);
      let inserted = parens ? ' {' : ') {';
      if (isUnlessConditional(node.parent, patcher.original) && requiresParentheses(node.expression)) {
        inserted = `)${inserted}`;
      }
      patcher.insert(node.range[1] + (parens ? ')'.length : 0), inserted);
    }
  } else if (isConsequent(node)) {
    if (isExpressionResultUsed(node.parent)) {
      if (node.parent.alternate) {
        // e.g. `a(if b then c else d)` -> `a(b ? c : d)`
        //                     ^^^^                 ^
        replaceBetween(patcher, node, node.parent.alternate, 'else', ':');
      } else {
        // e.g. `a(if b then c)` -> `a(b ? c : undefined)
        //                                  ^^^^^^^^^^^^
        patcher.insert(node.range[1], ' : undefined');
      }
    } else if (node.parent.alternate) {
      // Only add the opening curly for the alternate if it is not a conditional,
      // otherwise the handler for the end of its condition will add it.
      replaceBetween(
        patcher,
        node,
        node.parent.alternate,
        'else',
        `} else${node.parent.alternate.type === 'Conditional' ? '' : ' {'}`
      );
    }
  } else if (node.type === 'Conditional' && (!node.alternate || node.alternate.type !== 'Conditional')) {
    if (!isExpressionResultUsed(node)) {
      // Close the conditional if it isn't handled by closing an `else if`.
      if (isOneLineConditionAndConsequent(node, patcher.original)) {
        patcher.insert(node.range[1], ' }');
      } else {
        patcher.insert(node.range[1], `\n${getIndent(patcher.original, node.range[0])}}`);
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
  return node.parent ? node.parent.type === 'Conditional' && node.parent.condition === node : false;
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
  return node.parent ? node.parent.type === 'Conditional' && node.parent.consequent === node : false;
}

/**
 * Determines whether a node is a Conditional node's alternate.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isAlternate(node) {
  return node.parent ? node.parent.type === 'Conditional' && node.parent.alternate === node : false;
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
