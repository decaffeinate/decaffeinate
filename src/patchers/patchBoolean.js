import { isBool } from '../utils/types';

/**
 * Replace "off" and "on" boolean values with "false" and "true".
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function patchBoolean(node, patcher) {
  if (isBool(node, 'off')) {
    patcher.overwrite(node.range[0], node.range[1], 'false');
  } else if (isBool(node, 'on')) {
    patcher.overwrite(node.range[0], node.range[1], 'true');
  }
}
