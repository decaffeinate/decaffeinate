const BOUND_ARROW = '=>';
const UNBOUND_ARROW = '->';

/**
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function convertBoundFunctionToUnboundFunction(node, patcher) {
  let source = patcher.original;
  let [ start, end ] = node.range;
  let offset = start;

  if (node.parameters.length > 0) {
    offset = node.parameters[node.parameters.length - 1].range[1];
  }

  let index = source.indexOf(BOUND_ARROW, offset);

  if (index < offset && index >= end) {
    throw new Error(`unable to locate arrow in bound function: ${JSON.stringify(node.raw)}`);
  }

  patcher.overwrite(index, index + BOUND_ARROW.length, UNBOUND_ARROW);
}
