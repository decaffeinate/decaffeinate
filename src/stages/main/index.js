import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher.js';
import AssignOpPatcher from './patchers/AssignOpPatcher.js';
import BinaryOpPatcher from './patchers/BinaryOpPatcher.js';
import BlockPatcher from './patchers/BlockPatcher.js';
import BoolPatcher from './patchers/BoolPatcher.js';
import BoundFunctionPatcher from './patchers/BoundFunctionPatcher.js';
import BoundGeneratorFunctionPatcher from './patchers/BoundGeneratorFunctionPatcher.js';
import ChainedComparisonOpPatcher from './patchers/ChainedComparisonOpPatcher.js';
import ClassAssignOpPatcher from './patchers/ClassAssignOpPatcher.js';
import ClassPatcher from './patchers/ClassPatcher.js';
import CompoundAssignOpPatcher from './patchers/CompoundAssignOpPatcher.js';
import ConditionalPatcher from './patchers/ConditionalPatcher.js';
import ConstructorPatcher from './patchers/ConstructorPatcher.js';
import DefaultParamPatcher from './patchers/DefaultParamPatcher.js';
import DoOpPatcher from './patchers/DoOpPatcher.js';
import DynamicMemberAccessOpPatcher from './patchers/DynamicMemberAccessOpPatcher.js';
import EqualityPatcher from './patchers/EqualityPatcher.js';
import ExpOpPatcher from './patchers/ExpOpPatcher.js';
import ExistsOpCompoundAssignOpPatcher from './patchers/ExistsOpCompoundAssignOpPatcher.js';
import ExistsOpPatcher from './patchers/ExistsOpPatcher.js';
import ExpansionPatcher from './patchers/ExpansionPatcher.js';
import ExtendsOpPatcher from './patchers/ExtendsOpPatcher.js';
import FloorDivideOpPatcher from './patchers/FloorDivideOpPatcher.js';
import ForInPatcher from './patchers/ForInPatcher.js';
import ForOfPatcher from './patchers/ForOfPatcher.js';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher.js';
import FunctionPatcher from './patchers/FunctionPatcher.js';
import HerestringPatcher from './patchers/HerestringPatcher.js';
import IdentifierPatcher from './patchers/IdentifierPatcher.js';
import InOpPatcher from './patchers/InOpPatcher.js';
import InstanceofOpPatcher from './patchers/InstanceofOpPatcher.js';
import JavaScriptPatcher from './patchers/JavaScriptPatcher.js';
import LogicalNotOpPatcher from './patchers/LogicalNotOpPatcher.js';
import LogicalOpCompoundAssignOpPatcher from './patchers/LogicalOpCompoundAssignOpPatcher.js';
import LogicalOpPatcher from './patchers/LogicalOpPatcher.js';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher.js';
import ModuloOpPatcher from './patchers/ModuloOpPatcher.js';
import NewOpPatcher from './patchers/NewOpPatcher.js';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher.js';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher.js';
import OfOpPatcher from './patchers/OfOpPatcher.js';
import PassthroughPatcher from './../../patchers/PassthroughPatcher.js';
import ProgramPatcher from './patchers/ProgramPatcher.js';
import ProtoMemberAccessOpPatcher from './patchers/ProtoMemberAccessOpPatcher.js';
import RangePatcher from './patchers/RangePatcher.js';
import RegExpPatcher from './patchers/RegExpPatcher.js';
import RestPatcher from './patchers/RestPatcher.js';
import ReturnPatcher from './patchers/ReturnPatcher.js';
import SeqOpPatcher from './patchers/SeqOpPatcher.js';
import SlicePatcher from './patchers/SlicePatcher.js';
import SoakedDynamicMemberAccessOpPatcher from './patchers/SoakedDynamicMemberAccessOpPatcher.js';
import SoakedFunctionApplicationPatcher from './patchers/SoakedFunctionApplicationPatcher.js';
import SoakedMemberAccessOpPatcher from './patchers/SoakedMemberAccessOpPatcher.js';
import SpreadPatcher from './patchers/SpreadPatcher.js';
import StringPatcher from './patchers/StringPatcher.js';
import SuperPatcher from './patchers/SuperPatcher.js';
import SwitchCasePatcher from './patchers/SwitchCasePatcher.js';
import SwitchPatcher from './patchers/SwitchPatcher.js';
import TemplateLiteralPatcher from './patchers/TemplateLiteralPatcher.js';
import ThisPatcher from './patchers/ThisPatcher.js';
import ThrowPatcher from './patchers/ThrowPatcher.js';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage.js';
import TryPatcher from './patchers/TryPatcher.js';
import UnaryExistsOpPatcher from './patchers/UnaryExistsOpPatcher.js';
import UnaryMathOpPatcher from './patchers/UnaryMathOpPatcher.js';
import UnaryOpPatcher from './patchers/UnaryOpPatcher.js';
import UnaryTypeofOpPatcher from './patchers/UnaryTypeofOpPatcher.js';
import WhilePatcher from './patchers/WhilePatcher.js';
import GeneratorFunctionPatcher from './patchers/GeneratorFunctionPatcher.js';
import YieldPatcher from './patchers/YieldPatcher.js';
import YieldFromPatcher from './patchers/YieldFromPatcher.js';
import type NodePatcher from './../../patchers/NodePatcher.js';
import type { Node } from '../../patchers/types.js';

export default class MainStage extends TransformCoffeeScriptStage {
  patcherConstructorForNode(node: Node): ?Class<NodePatcher> {
    switch (node.type) {
      case 'Identifier':
        return IdentifierPatcher;

      case 'String':
        return StringPatcher;
      case 'Int':
      case 'Float':
      case 'Null':
      case 'Undefined':
      case 'PostIncrementOp':
      case 'PostDecrementOp':
      case 'PreIncrementOp':
      case 'PreDecrementOp':
        return PassthroughPatcher;

      case 'FunctionApplication':
        return FunctionApplicationPatcher;

      case 'SoakedFunctionApplication':
        return SoakedFunctionApplicationPatcher;

      case 'MemberAccessOp':
        return MemberAccessOpPatcher;

      case 'DynamicMemberAccessOp':
        return DynamicMemberAccessOpPatcher;

      case 'EQOp':
      case 'NEQOp':
      case 'LTOp':
      case 'GTOp':
      case 'LTEOp':
      case 'GTEOp':
        return EqualityPatcher;

      case 'ObjectInitialiserMember':
        return ObjectInitialiserMemberPatcher;

      case 'ObjectInitialiser':
        return ObjectInitialiserPatcher;

      case 'This':
        return ThisPatcher;
  
      case 'Yield':
       return YieldPatcher;
    
      case 'YieldFrom':
       return YieldFromPatcher;
    
      case 'GeneratorFunction':
       return GeneratorFunctionPatcher;
    
      case 'Function':
        return FunctionPatcher;

      case 'BoundFunction':
        return BoundFunctionPatcher;

      case 'BoundGeneratorFunction':
        return BoundGeneratorFunctionPatcher;

      case 'Bool':
        return BoolPatcher;

      case 'Conditional':
        return ConditionalPatcher;

      case 'ArrayInitialiser':
        return ArrayInitialiserPatcher;

      case 'Block':
        return BlockPatcher;

      case 'AssignOp':
        return AssignOpPatcher;

      case 'DefaultParam':
        return DefaultParamPatcher;

      case 'CompoundAssignOp':
        switch (node.op) {
          case 'LogicalAndOp':
          case 'LogicalOrOp':
            return LogicalOpCompoundAssignOpPatcher;

          case 'ExistsOp':
            return ExistsOpCompoundAssignOpPatcher;

          default:
            return CompoundAssignOpPatcher;
        }

      case 'Return':
        return ReturnPatcher;

      case 'PlusOp':
      case 'SubtractOp':
      case 'DivideOp':
      case 'MultiplyOp':
      case 'RemOp':
      case 'BitAndOp':
      case 'BitOrOp':
      case 'BitXorOp':
      case 'LeftShiftOp':
      case 'SignedRightShiftOp':
      case 'UnsignedRightShiftOp':
        return BinaryOpPatcher;

      case 'ModuloOp':
        return ModuloOpPatcher;

      case 'RegExp':
        return RegExpPatcher;

      case 'ExistsOp':
        return ExistsOpPatcher;

      case 'LogicalAndOp':
      case 'LogicalOrOp':
        return LogicalOpPatcher;

      case 'LogicalNotOp':
        return LogicalNotOpPatcher;

      case 'TemplateLiteral':
        return TemplateLiteralPatcher;

      case 'SoakedMemberAccessOp':
        return SoakedMemberAccessOpPatcher;

      case 'SoakedDynamicMemberAccessOp':
        return SoakedDynamicMemberAccessOpPatcher;

      case 'Herestring':
        return HerestringPatcher;

      case 'ForIn':
        return ForInPatcher;

      case 'ForOf':
        return ForOfPatcher;

      case 'While':
        return WhilePatcher;

      case 'NewOp':
        return NewOpPatcher;

      case 'InOp':
        return InOpPatcher;

      case 'Slice':
        return SlicePatcher;

      case 'Expansion':
        return ExpansionPatcher;

      case 'Rest':
        return RestPatcher;

      case 'Spread':
        return SpreadPatcher;

      case 'Range':
        return RangePatcher;

      case 'Throw':
        return ThrowPatcher;

      case 'UnaryPlusOp':
      case 'UnaryNegateOp':
      case 'BitNotOp':
        return UnaryMathOpPatcher;

      case 'TypeofOp':
        return UnaryTypeofOpPatcher;

      case 'DeleteOp':
        return UnaryOpPatcher;

      case 'UnaryExistsOp':
        return UnaryExistsOpPatcher;

      case 'ClassProtoAssignOp':
        return ClassAssignOpPatcher;

      case 'Super':
        return SuperPatcher;

      case 'Class':
        return ClassPatcher;

      case 'Constructor':
        return ConstructorPatcher;

      case 'Try':
        return TryPatcher;

      case 'Switch':
        return SwitchPatcher;

      case 'SwitchCase':
        return SwitchCasePatcher;

      case 'DoOp':
        return DoOpPatcher;

      case 'ProtoMemberAccessOp':
        return ProtoMemberAccessOpPatcher;

      case 'Program':
        return ProgramPatcher;

      case 'InstanceofOp':
        return InstanceofOpPatcher;

      case 'OfOp':
        return OfOpPatcher;

      case 'ChainedComparisonOp':
        return ChainedComparisonOpPatcher;

      case 'SeqOp':
        return SeqOpPatcher;

      case 'JavaScript':
        return JavaScriptPatcher;

      case 'FloorDivideOp':
        return FloorDivideOpPatcher;

      case 'ExpOp':
        return ExpOpPatcher;

      case 'ExtendsOp':
        return ExtendsOpPatcher;

      default:
        return null;
    }
  }
}
