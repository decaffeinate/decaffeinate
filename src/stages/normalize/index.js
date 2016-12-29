import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher';
import BlockPatcher from './patchers/BlockPatcher';
import ClassPatcher from './patchers/ClassPatcher';
import AssignOpPatcher from './patchers/AssignOpPatcher';
import ConditionalPatcher from './patchers/ConditionalPatcher';
import DoOpPatcher from './patchers/DoOpPatcher';
import ExpansionPatcher from './patchers/ExpansionPatcher';
import ForInPatcher from './patchers/ForInPatcher';
import ForOfPatcher from './patchers/ForOfPatcher';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher';
import IdentifierPatcher from './patchers/IdentifierPatcher';
import LoopPatcher from './patchers/LoopPatcher';
import NodePatcher from '../../patchers/NodePatcher';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher';
import PassthroughPatcher from '../../patchers/PassthroughPatcher';
import ProgramPatcher from './patchers/ProgramPatcher';
import SpreadPatcher from './patchers/SpreadPatcher';
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

      case 'Expansion':
        return ExpansionPatcher;

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

      case 'Loop':
        return LoopPatcher;

      case 'Class':
        return ClassPatcher;

      case 'AssignOp':
      case 'ClassProtoAssignOp':
        return AssignOpPatcher;

      case 'Program':
        return ProgramPatcher;

      case 'DefaultParam':
        return DefaultParamPatcher;

      case 'Rest':
      case 'Spread':
        return SpreadPatcher;

      case 'ObjectInitialiser':
        return ObjectInitialiserPatcher;

      case 'ObjectInitialiserMember':
        return ObjectInitialiserMemberPatcher;

      default:
        return PassthroughPatcher;
    }
  }
}
