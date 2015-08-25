import adjustIndent from '../utils/adjustIndent';
import getFreeBinding from '../utils/getFreeBinding';
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
      let thisDotParameter = getThisDotParameter(param);
      if (thisDotParameter) {
        // `@a` -> `a`
        const paramName = getFreeBinding(node.scope, thisDotParameter.memberName);
        patcher.overwrite(thisDotParameter.range[0], thisDotParameter.range[1], paramName);
        assignments.push(`this.${thisDotParameter.memberName} = ${paramName}`);
      }
    });

    if (assignments.length > 0) {
      const indent = adjustIndent(patcher.original, node.range[0], 1);
      const insertionPoint = node.body ? node.body.range[0] : node.range[1];

      if (isMultiline(patcher.original, node)) {
        // put each assignment on its own line
        patcher.insert(insertionPoint, assignments.map(assignment => `${assignment}\n${indent}`).join(''));
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
 * @returns {?Object}
 */
function getThisDotParameter(node) {
  if (!isParameter(node)) {
    return false;
  }

  if (node.type === 'DefaultParam') {
    node = node.param;
  }

  if (node.type === 'MemberAccessOp' && node.expression.type === 'This') {
    return node;
  } else {
    return null;
  }
}
