import isPrecededBy from '../utils/isPrecededBy';

export function patchObjectBraceOpening(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parent.type !== 'FunctionApplication') {
    if (patcher.original[node.range[0]] !== '{') {
      patcher.insert(node.range[0], isObjectAsStatement(node) ? '({' : '{');
    } else if (isObjectAsStatement(node)) {
      patcher.insert(node.range[0], '(');
    }
  }
}

export function patchObjectBraceClosing(node, patcher) {
  if (node.type === 'ObjectInitialiser' && node.parent.type !== 'FunctionApplication') {
    if (patcher.original[node.range[0]] !== '{') {
      patcher.insert(node.range[1], isObjectAsStatement(node) ? '})' : '}');
    } else if (isObjectAsStatement(node)) {
      patcher.insert(node.range[1], ')');
    }
  }
}

function isObjectAsStatement(node) {
  return node.parent.type === 'Block';
}
