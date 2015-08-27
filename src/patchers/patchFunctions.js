import getIndent from '../utils/getIndent';
import isMultiline from '../utils/isMultiline';
import isStatement from '../utils/isStatement';
import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Patches the start of arrow functions to make them into JavaScript functions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchFunctionStart(node, patcher) {
  switch (node.type) {
    case 'Function':
      if (!isMethodDeclaration(node)) {
        patchUnboundFunctionStart(node, patcher);
      }
      break;

    case 'BoundFunction':
      if (!isMethodDeclaration(node)) {
        patchBoundFunctionStart(node, patcher);
      }
      break;

    case 'ClassProtoAssignOp':
      if (node.expression.type === 'Function') {
        patchConciseUnboundFunctionStart(node, patcher);
      }
      break;

    case 'Constructor':
      patchConciseUnboundFunctionStart(node, patcher);
      break;
  }
}

/**
 * Determines whether a node is a method declaration.
 *
 * @param node
 * @returns {boolean}
 */
function isMethodDeclaration(node) {
  return (node.type === 'Function' || node.type === 'BoundFunction') &&
    (node.parentNode.type === 'ClassProtoAssignOp' || node.parentNode.type === 'Constructor');
}

/**
 * Converts unbound functions into regular functions.
 *
 * @param {Object} node Function
 * @param {MagicString} patcher
 */
function patchUnboundFunctionStart(node, patcher) {
  const start = node.range[0];
  if (patcher.slice(start, start + 2) === '->') {
    patcher.overwrite(start, start + 2, `${isStatement(node) ? '(' : ''}function() {`);
  } else {
    patcher.insert(start, isStatement(node) ? '(function' : 'function');

    let arrowStart = patcher.original.indexOf('->', start);

    if (arrowStart < 0) {
      throw new Error(
        'unable to find `->` for function starting at line ' +
        node.line + ', column ' + node.column
      );
    }

    patcher.overwrite(arrowStart, arrowStart + 2, '{');
  }
}

/**
 * Converts bound functions into arrow functions.
 *
 * @param {Object} node BoundFunction
 * @param {MagicString} patcher
 */
function patchBoundFunctionStart(node, patcher) {
  if (patcher.slice(node.range[0], node.range[0] + 1) !== '(') {
    patcher.insert(node.range[0], '() ');
  }

  if (node.body.type === 'Block') {
    let arrowStart = node.parameters.length > 0 ?
      node.parameters[node.parameters.length - 1].range[1] :
      node.range[0];

    arrowStart = patcher.original.indexOf('=>', arrowStart);

    if (arrowStart < 0) {
      throw new Error(
        'unable to find `=>` for function starting at line ' +
        node.line + ', column ' + node.column
      );
    }

    patcher.insert(arrowStart + 2, ' {');
  } else if (node.body.type === 'SeqOp') {
    // Wrap sequences in parens, e.g. `a; b` becomes `(a, b)`.
    patcher.insert(node.body.range[0], '(');
  }
}

/**
 * Converts bound functions into arrow functions.
 *
 * @param {Object} node ClassProtoAssignOp|Constructor
 * @param {MagicString} patcher
 */
function patchConciseUnboundFunctionStart(node, patcher) {
  const keyRange = node.type === 'Constructor' ?
    [node.range[0], node.range[0] + 'constructor'.length] :
    node.assignee.range;
  const fn = node.expression;
  const start = fn.range[0];
  if (patcher.slice(start, start + 2) === '->') {
    patcher.overwrite(keyRange[1], start + 2, '() {');
  } else {
    patcher.overwrite(keyRange[1], fn.range[0], '');

    let arrowStart = patcher.original.indexOf('->', start);

    if (arrowStart < 0) {
      throw new Error(
        'unable to find `->` for function starting at line ' +
        fn.line + ', column ' + fn.column
      );
    }

    patcher.overwrite(arrowStart, arrowStart + 2, '{');
  }
}

/**
 * Patches the end of arrow functions to make them into JavaScript functions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchFunctionEnd(node, patcher) {
  if (node.type === 'Function' || node.type === 'BoundFunction') {
    let nodeRange = trimmedNodeRange(node, patcher.original);
    let functionClose = '';

    if (isMultiline(patcher.original, node)) {
      functionClose = `\n${getIndent(patcher.original, nodeRange[0])}}`;
    } else if (node.type === 'Function') {
      functionClose = node.body ? ' }' : '}';
    }

    if (node.type === 'Function' && isStatement(node)) {
      functionClose += ')';
    } else if (node.type === 'BoundFunction' && node.body.type === 'SeqOp') {
      // Wrap sequences in parens, e.g. `a; b` becomes `(a, b)`.
      functionClose += ')';
    }

    if (functionClose) {
      patcher.insert(nodeRange[1], functionClose);
    }
  }
}
