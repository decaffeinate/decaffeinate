import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher.js';
import BlockPatcher from './patchers/BlockPatcher.js';
import ClassPatcher from './patchers/ClassPatcher.js';
import AssignOpPatcher from './patchers/AssignOpPatcher.js';
import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import DoOpPatcher from './patchers/DoOpPatcher.js';
import ForInPatcher from './patchers/ForInPatcher.js';
import ForOfPatcher from './patchers/ForOfPatcher.js';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher.js';
import IdentifierPatcher from './patchers/IdentifierPatcher.js';
import NodePatcher from '../../patchers/NodePatcher.js';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher.js';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher.js';
import PassthroughPatcher from '../../patchers/PassthroughPatcher.js';
import ProgramPatcher from './patchers/ProgramPatcher.js';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage.js';
import WhilePatcher from './patchers/WhilePatcher.js';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher.js';
import FunctionPatcher from './patchers/FunctionPatcher.js';
import DefaultParamPatcher from './patchers/DefaultParamPatcher.js';
import type { Node } from '../../patchers/types.js';

export default class NormalizeStage extends TransformCoffeeScriptStage {
  static get outputExtension(): string {
    return '.coffee';
  }

  patcherConstructorForNode(node: Node): ?Class<NodePatcher> {
    switch (node.type) {
      case 'ArrayInitialiser':
        return ArrayInitialiserPatcher;

      case 'MemberAccessOp':
        return MemberAccessOpPatcher;

      case 'Block':
        return BlockPatcher;

      case 'BoundFunction':
      case 'Function':
        return FunctionPatcher;

      case 'Conditional':
        return ConditionalPatcher;

      case 'DoOp':
        return DoOpPatcher;

      case 'ForIn':
        return ForInPatcher;

      case 'ForOf':
        return ForOfPatcher;

      case 'FunctionApplication':
      case 'NewOp':
      case 'SoakedFunctionApplication':
        return FunctionApplicationPatcher;

      case 'Identifier':
        return IdentifierPatcher;

      case 'While':
        return WhilePatcher;

      case 'Class':
        return ClassPatcher;

      case 'AssignOp':
      case 'ClassProtoAssignOp':
        return AssignOpPatcher;

      case 'Program':
        return ProgramPatcher;

      case 'DefaultParam':
        return DefaultParamPatcher;

      case 'ObjectInitialiser':
        return ObjectInitialiserPatcher;

      case 'ObjectInitialiserMember':
        return ObjectInitialiserMemberPatcher;
      
      default:
        return PassthroughPatcher;
    }
  }
}
