import getIndent from '../utils/getIndent';
import isMultiline from '../utils/isMultiline';
import isStatement from '../utils/isStatement';

/**
 * Patches the start of arrow functions to make them into JavaScript functions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchFunctionStart(node, patcher) {
  if (node.type === 'Function') {
    const start = node.range[0];
    if (patcher.slice(start, start + 2) === '->') {
      patcher.replace(start, start + 2, `${isStatement(node) ? '(' : ''}function() {`);
    } else {
      patcher.insert(start, isStatement(node) ? '(function' : 'function');

      let arrowStart = patcher.original.indexOf('->', start);

      if (arrowStart < 0) {
        throw new Error(
          'unable to find `->` for function starting at line ' +
          node.line + ', column ' + node.column
        );
      }

      patcher.replace(arrowStart, arrowStart + 2, '{');
    }
  } else if (node.type === 'BoundFunction') {
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
}

/**
 * Patches the end of arrow functions to make them into JavaScript functions.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export function patchFunctionEnd(node, patcher) {
  if (node.type === 'Function' || node.type === 'BoundFunction') {
    let functionClose = '';

    if (isMultiline(patcher.original, node)) {
      functionClose = `\n${getIndent(patcher.original, node.range[0])}}`;
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
      patcher.insert(node.range[1], functionClose);
    }
  }
}
