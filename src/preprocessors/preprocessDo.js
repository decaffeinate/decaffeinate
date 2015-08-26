import trimmedNodeRange from '../utils/trimmedNodeRange';

/**
 * Preprocesses `do` expressions by turning them into IIFEs.
 *
 * @param {Object} node
 * @param {MagicString} patcher
 */
export default function preprocessDo(node, patcher) {
  if (node.type === 'DoOp') {
    const { expression } = node;
    const { parameters } = expression;
    const trimmedRange = trimmedNodeRange(node, patcher.original)

    // Remove initializers from default params.
    parameters.forEach(param => {
      if (param.type === 'DefaultParam') {
        patcher.remove(param.param.range[1], param.default.range[1]);
      }
    });

    // Collect the arguments that should be used for the IIFE call.
    let args = parameters.map(argumentForDoParameter);
    patcher.overwrite(trimmedRange[0], expression.range[0], `(`);
    patcher.overwrite(trimmedRange[1], trimmedRange[1], `)(${args.join(', ')})`);
    return true;
  }
}

function argumentForDoParameter(node) {
  switch (node.type) {
    case 'DefaultParam':
      return node.default.raw;

    default:
      return node.raw;
  }
}
