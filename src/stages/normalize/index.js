import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher';
import BlockPatcher from './patchers/BlockPatcher';
import ClassPatcher from './patchers/ClassPatcher';
import AssignOpPatcher from './patchers/AssignOpPatcher';
import ConditionalPatcher from './patchers/ConditionalPatcher';
import DoOpPatcher from './patchers/DoOpPatcher';
import ForInPatcher from './patchers/ForInPatcher';
import ForOfPatcher from './patchers/ForOfPatcher';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher';
import IdentifierPatcher from './patchers/IdentifierPatcher';
import NodePatcher from '../../patchers/NodePatcher';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher';
import PassthroughPatcher from '../../patchers/PassthroughPatcher';
import ProgramPatcher from './patchers/ProgramPatcher';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage';
import WhilePatcher from './patchers/WhilePatcher';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher';
import FunctionPatcher from './patchers/FunctionPatcher';
import DefaultParamPatcher from './patchers/DefaultParamPatcher';
import type { Node } from '../../patchers/types';

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
