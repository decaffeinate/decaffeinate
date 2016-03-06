import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import NodePatcher from '../../patchers/NodePatcher.js';
import PassthroughPatcher from '../../patchers/PassthroughPatcher.js';
import Stage from '../Stage.js';
import type { Node } from '../../patchers/types.js';

export default class NormalizeStage extends Stage {
  patcherConstructorForNode(node: Node): ?Class<NodePatcher> {
    switch (node.type) {
      case 'Conditional':
        return ConditionalPatcher;

      default:
        return PassthroughPatcher;
    }
  }
}
