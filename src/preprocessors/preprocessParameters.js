import { strictEqual } from 'assert';
import getFreeBinding from '../utils/getFreeBinding';
import getIndent from '../utils/getIndent';
import isMultiline from '../utils/isMultiline';
import isParameter from '../utils/isParameter';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function preprocessParameters(node, patcher) {
  if (node.type === 'Function' || node.type === 'BoundFunction') {
    const assignments = [];

    node.parameters.forEach(param => {
      if (isThisDotParameter(param)) {
        // `@a` -> `a`
        const paramName = getFreeBinding(node.scope, param.memberName);
        patcher.overwrite(param.range[0], param.range[1], paramName);
        assignments.push(`this.${param.memberName} = ${paramName}`);
      }
    });

    if (assignments.length > 0) {
      const indent = getIndent(patcher.original, node.range[0]);
      const insertionPoint = node.body ? node.body.range[0] : node.range[1];

      if (isMultiline(patcher.original, node)) {
        // put each assignment on its own line
        patcher.insert(insertionPoint, assignments.map(assignment => `${assignment}\n${indent}  `).join(''));
      } else {
        // put the assignments all on one line
        patcher.insert(insertionPoint, ` ${assignments.join('; ')}`);
      }

      return true;
    }
  }
}

/**
 * Determines whether this is a `@foo` in the place of a function parameter.
 *
 * @param {Object} node
 * @returns {boolean}
 */
function isThisDotParameter(node) {
  if (!isParameter(node)) {
    return false;
  }

  return node.type === 'MemberAccessOp' && node.expression.type === 'This';
}
