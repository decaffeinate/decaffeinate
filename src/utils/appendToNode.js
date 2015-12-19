import { getNodeEnd, markNodeEnd } from './nodeEnd';

/**
 * Appends content to a node, marking the index for future appends.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 * @param {string} content
 * @param {number=} index
 */
export default function appendToNode(node, patcher, content, index=getNodeEnd(node)) {
  patcher.insert(index, content);
  markNodeEnd(node, index);
}
