import replaceBetween from '../utils/replaceBetween';

/**
 * Renames keywords to the JavaScript equivalent.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchKeywords(node, patcher) {
  const source = patcher.original;

  switch (node.type) {
    case 'Bool':
      switch (node.raw) {
        case 'yes':
          patcher.replace(node.range[0], node.range[1], 'true');
          break;

        case 'no':
          patcher.replace(node.range[0], node.range[1], 'false');
          break;
      }
      break;

    case 'LogicalAndOp':
      replaceBetween(patcher, node.left, node.right, 'and', '&&');
      break;

    case 'LogicalOrOp':
      replaceBetween(patcher, node.left, node.right, 'or', '||');
      break;

    case 'LogicalNotOp':
      if (node.raw.slice(0, 4) === 'not ') {
        patcher.replace(node.range[0], node.range[0] + 4, '!');
      } else if (node.raw.slice(0, 3) === 'not') {
        patcher.replace(node.range[0], node.range[0] + 3, '!');
      }
      break;
  }
}
