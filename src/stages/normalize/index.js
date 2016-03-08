import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import NodePatcher from '../../patchers/NodePatcher.js';
import PassthroughPatcher from '../../patchers/PassthroughPatcher.js';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage.js';
import type { Node } from '../../patchers/types.js';

export default class NormalizeStage extends TransformCoffeeScriptStage {
  static get outputExtension() {
    return '.coffee';
  }

  patcherConstructorForNode(node: Node): ?Class<NodePatcher> {
    switch (node.type) {
      case 'Conditional':
        return ConditionalPatcher;

      default:
        return PassthroughPatcher;
    }
  }
}
