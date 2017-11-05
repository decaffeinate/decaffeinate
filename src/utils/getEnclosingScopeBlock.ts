import NodePatcher from '../patchers/NodePatcher';
import BlockPatcher from '../stages/main/patchers/BlockPatcher';
import notNull from './notNull';

/**
 * For main stage nodes, find the block corresponding to this node's scope.
 */
export default function getEnclosingScopeBlock(patcher: NodePatcher): BlockPatcher {
  let currentPatcher: NodePatcher | null = patcher;
  while (currentPatcher) {
    if (currentPatcher instanceof BlockPatcher &&
      notNull(currentPatcher.parent).node === patcher.getScope().containerNode) {
      return currentPatcher;
    }
    currentPatcher = currentPatcher.parent;
  }
  throw patcher.error('Expected to find enclosing scope block.');
}
