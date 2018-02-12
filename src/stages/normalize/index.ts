import { Node } from 'decaffeinate-parser/dist/nodes';
import { PatcherClass } from '../../patchers/NodePatcher';
import PassthroughPatcher from '../../patchers/PassthroughPatcher';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage';
import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher';
import AssignOpPatcher from './patchers/AssignOpPatcher';
import BlockPatcher from './patchers/BlockPatcher';
import ClassPatcher from './patchers/ClassPatcher';
import ConditionalPatcher from './patchers/ConditionalPatcher';
import ConstructorPatcher from './patchers/ConstructorPatcher';
import DefaultParamPatcher from './patchers/DefaultParamPatcher';
import DoOpPatcher from './patchers/DoOpPatcher';
import DynamicMemberAccessOpPatcher from './patchers/DynamicMemberAccessOpPatcher';
import ExpansionPatcher from './patchers/ExpansionPatcher';
import ForFromPatcher from './patchers/ForFromPatcher';
import ForInPatcher from './patchers/ForInPatcher';
import ForOfPatcher from './patchers/ForOfPatcher';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher';
import FunctionPatcher from './patchers/FunctionPatcher';
import IdentifierPatcher from './patchers/IdentifierPatcher';
import LoopPatcher from './patchers/LoopPatcher';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher';
import ProgramPatcher from './patchers/ProgramPatcher';
import ProtoMemberAccessOpPatcher from './patchers/ProtoMemberAccessOpPatcher';
import SpreadPatcher from './patchers/SpreadPatcher';
import SuperPatcher from './patchers/SuperPatcher';
import ThisPatcher from './patchers/ThisPatcher';
import TryPatcher from './patchers/TryPatcher';
import WhilePatcher from './patchers/WhilePatcher';

export default class NormalizeStage extends TransformCoffeeScriptStage {
  patcherConstructorForNode(node: Node): PatcherClass | null {
    switch (node.type) {
      case 'ArrayInitialiser':
        return ArrayInitialiserPatcher;

      case 'MemberAccessOp':
        return MemberAccessOpPatcher;

      case 'DynamicMemberAccessOp':
        return DynamicMemberAccessOpPatcher;

      case 'Block':
        return BlockPatcher;

      case 'BoundFunction':
      case 'Function':
      case 'BoundGeneratorFunction':
      case 'GeneratorFunction':
        return FunctionPatcher;

      case 'Conditional':
        return ConditionalPatcher;

      case 'Constructor':
        return ConstructorPatcher;

      case 'DoOp':
        return DoOpPatcher;

      case 'Expansion':
        return ExpansionPatcher;

      case 'ForIn':
        return ForInPatcher;

      case 'ForOf':
        return ForOfPatcher;

      case 'ForFrom':
        return ForFromPatcher;

      case 'FunctionApplication':
      case 'NewOp':
      case 'SoakedFunctionApplication':
      case 'SoakedNewOp':
        return FunctionApplicationPatcher;

      case 'Super':
      case 'BareSuperFunctionApplication':
        return SuperPatcher;

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
      case 'CompoundAssignOp':
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

      case 'ProtoMemberAccessOp':
      case 'SoakedProtoMemberAccessOp':
        return ProtoMemberAccessOpPatcher;

      case 'Try':
        return TryPatcher;

      case 'This':
        return ThisPatcher;

      default:
        return PassthroughPatcher;
    }
  }
}
