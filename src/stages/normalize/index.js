import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import ForInPatcher from './patchers/ForInPatcher.js';
import ForOfPatcher from './patchers/ForOfPatcher.js';
import NodePatcher from '../../patchers/NodePatcher.js';
import PassthroughPatcher from '../../patchers/PassthroughPatcher.js';
import ProgramPatcher from './patchers/ProgramPatcher.js';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage.js';
import WhilePatcher from './patchers/WhilePatcher.js';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher.js';
import FunctionPatcher from './patchers/FunctionPatcher.js';
import type { Node } from '../../patchers/types.js';

export default class NormalizeStage extends TransformCoffeeScriptStage {
  static get outputExtension() {
    return '.coffee';
  }

  patcherConstructorForNode(node: Node): ?Class<NodePatcher> {
    switch (node.type) {
      case 'MemberAccessOp':
        return MemberAccessOpPatcher;

      case 'Function':
        return FunctionPatcher;

      case 'Conditional':
        return ConditionalPatcher;

      case 'ForIn':
        return ForInPatcher;

      case 'ForOf':
        return ForOfPatcher;

      case 'While':
        return WhilePatcher;

      case 'Program':
        return ProgramPatcher;

      default:
        return PassthroughPatcher;
    }
  }
}
