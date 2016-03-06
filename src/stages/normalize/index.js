import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import NodePatcher from '../../patchers/NodePatcher.js';
import PassthroughPatcher from '../../patchers/PassthroughPatcher.js';
import PatchError from '../../utils/PatchError.js';
import { childPropertyNames } from '../../utils/traverse.js';

export function makePatcher(node, context, editor, constructor=null, allPatchers=[]) {
  let props = childPropertyNames(node);

  if (!constructor) {
    constructor = patcherConstructorForNode(node);

    if (constructor === null) {
      throw new PatchError(
        `no patcher available for node type: ${node.type}` +
        `${props.length ? ` (props: ${props.join(', ')})` : ''}`,
        context,
        ...node.range
      );
    }
  }

  constructor = constructor.patcherClassOverrideForNode(node) || constructor;

  let children = props.map(name => {
    let child = node[name];
    if (!child) {
      return null;
    } else if (Array.isArray(child)) {
      return child.map(item =>
        makePatcher(
          item,
          context,
          editor,
          constructor.patcherClassForChildNode(item, name),
          allPatchers
        )
      );
    } else {
      return makePatcher(
        child,
        context,
        editor,
        constructor.patcherClassForChildNode(child, name),
        allPatchers
      );
    }
  });

  let patcher = new constructor(node, context, editor, ...children);
  allPatchers.push(patcher);
  associateParent(patcher, children);

  if (node.type === 'Program') {
    allPatchers.forEach(patcher => patcher.initialize());
  }

  return patcher;
}

function patcherConstructorForNode(node): ?Class<NodePatcher> {
  switch (node.type) {
    case 'Conditional':
      return ConditionalPatcher;

    default:
      return PassthroughPatcher;
  }
}

function associateParent(parent, child) {
  if (Array.isArray(child)) {
    child.forEach(item => associateParent(parent, item));
  } else if (child) {
    child.parent = parent;
  }
}
