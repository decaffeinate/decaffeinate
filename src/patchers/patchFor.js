import prependLinesToBlock from '../utils/prependLinesToBlock';
import rangeIncludingParentheses from '../utils/rangeIncludingParentheses';
import replaceBetween from '../utils/replaceBetween';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchForStart(node, patcher) {
  const { parentNode } = node;

  if (node.type === 'ForOf') {
    // e.g. `for key of object` -> `for (var key in object)`
    //                                  ^^^^^
    patcher.insert(node.range[0] + 'for '.length, '(var ');
  } else if (parentNode && parentNode.type === 'ForOf' && node === parentNode.target) {
    // e.g. `for key of object` -> `for (var key in object)`
    //              ^^^^                        ^^^^
    replaceBetween(patcher, parentNode.keyAssignee, node, ' of ', ' in ');
  } else if (node.type === 'ForIn') {
    // e.g. `for element in object` -> `for (var element…`
    //                                      ^^^^^
    patcher.insert(node.range[0] + 'for '.length, '(var ');
  } else if (parentNode && parentNode.type === 'ForIn' && node === parentNode.target) {
    patcher.overwrite(
      parentNode.keyAssignee.range[1],
      node.range[1],
      ` = ${initialValueForLoopCounter(parentNode)}; ${loopCondition(parentNode)}; ${loopIncrement(parentNode)}) {`
    );
  } else if (parentNode && parentNode.type === 'ForIn' && node === parentNode.step && node.range) {
    // remove e.g. `by 2` from for-in loops
    patcher.remove(parentNode.target.range[1], node.range[1]);
  }
}

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchForEnd(node, patcher) {
  const { parentNode } = node;

  if (isForLoopTarget(node)) {
    if (parentNode.type === 'ForIn') {
      //// e.g. `for element, i in list` -> `for (var element, i = 0; i < object.length; i++) {`
      ////                                                                      ^^^^^^^^^^^^^^^
      //patcher.insert(
      //  rangeIncludingParentheses(node, patcher.original)[1],
      //  `.length; ${loopIncrement(parentNode)}) {`
      //);
      prependLinesToBlock(
        patcher,
        [`${parentNode.valAssignee.raw} = ${node.raw}[${parentNode.keyAssignee.raw}];`],
        parentNode.body
      );
    } else if (parentNode.type === 'ForOf') {
      // e.g. `for key of object` -> `for (var key in object) {`
      //                                                    ^^^
      patcher.insert(rangeIncludingParentheses(node, patcher.original)[1], ') {');
    }
  } else if (node.type === 'ForOf' || node.type === 'ForIn') {
    // add closing brace for `for` loop block
    patcher.insert(trimmedNodeRange(node, patcher.original)[1], '\n}');
  }
}

function isForLoopTarget(node) {
  const { parentNode } = node;

  if (!parentNode) {
    return false;
  }

  switch (parentNode.type) {
    case 'ForOf':
    case 'ForIn':
      return node === parentNode.target;

    default:
      return false;
  }
}

function loopIncrement(node) {
  const stepCount = loopStepCount(node);
  const key = node.keyAssignee.raw;

  if (stepCount === 1) {
    return `${key}++`;
  }

  if (stepCount === -1) {
    return `${key}--`;
  }

  if (stepCount > 0) {
    return `${key} += ${stepCount}`;
  }

  return `${key} -= ${-stepCount}`;
}

function initialValueForLoopCounter(node) {
  const stepCount = loopStepCount(node);
  if (stepCount > 0) {
    return '0';
  } else {
    return `${node.target.raw}.length - 1`;
  }
}

function loopCondition(node) {
  let stepCount = loopStepCount(node);
  if (stepCount > 0) {
    return `${node.keyAssignee.raw} < ${node.target.raw}.length`;
  } else {
    return `${node.keyAssignee.raw} >= 0`;
  }
}

function loopStepCount(node) {
  if (node.step.type === 'UnaryNegateOp') {
    return -node.step.expression.data;
  } else {
    return node.step.data;
  }
}
