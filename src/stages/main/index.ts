import { CompoundAssignOp, Node } from 'decaffeinate-parser/dist/nodes';
import { PatcherClass } from '../../patchers/NodePatcher';
import TransformCoffeeScriptStage from '../TransformCoffeeScriptStage';
import PassthroughPatcher from './../../patchers/PassthroughPatcher';
import ArrayInitialiserPatcher from './patchers/ArrayInitialiserPatcher';
import AssignOpPatcher from './patchers/AssignOpPatcher';
import BinaryOpPatcher from './patchers/BinaryOpPatcher';
import BlockPatcher from './patchers/BlockPatcher';
import BoolPatcher from './patchers/BoolPatcher';
import BoundFunctionPatcher from './patchers/BoundFunctionPatcher';
import BoundGeneratorFunctionPatcher from './patchers/BoundGeneratorFunctionPatcher';
import BreakPatcher from './patchers/BreakPatcher';
import ChainedComparisonOpPatcher from './patchers/ChainedComparisonOpPatcher';
import ClassAssignOpPatcher from './patchers/ClassAssignOpPatcher';
import ClassPatcher from './patchers/ClassPatcher';
import CompoundAssignOpPatcher from './patchers/CompoundAssignOpPatcher';
import ConditionalPatcher from './patchers/ConditionalPatcher';
import ConstructorPatcher from './patchers/ConstructorPatcher';
import ContinuePatcher from './patchers/ContinuePatcher';
import DefaultParamPatcher from './patchers/DefaultParamPatcher';
import DoOpPatcher from './patchers/DoOpPatcher';
import DynamicMemberAccessOpPatcher from './patchers/DynamicMemberAccessOpPatcher';
import EqualityPatcher from './patchers/EqualityPatcher';
import ExistsOpCompoundAssignOpPatcher from './patchers/ExistsOpCompoundAssignOpPatcher';
import ExistsOpPatcher from './patchers/ExistsOpPatcher';
import ExpansionPatcher from './patchers/ExpansionPatcher';
import ExpOpPatcher from './patchers/ExpOpPatcher';
import ExtendsOpPatcher from './patchers/ExtendsOpPatcher';
import FloorDivideOpCompoundAssignOpPatcher from './patchers/FloorDivideOpCompoundAssignOpPatcher';
import FloorDivideOpPatcher from './patchers/FloorDivideOpPatcher';
import ForInPatcher from './patchers/ForInPatcher';
import ForOfPatcher from './patchers/ForOfPatcher';
import FunctionApplicationPatcher from './patchers/FunctionApplicationPatcher';
import FunctionPatcher from './patchers/FunctionPatcher';
import GeneratorFunctionPatcher from './patchers/GeneratorFunctionPatcher';
import HeregexPatcher from './patchers/HeregexPatcher';
import IdentifierPatcher from './patchers/IdentifierPatcher';
import IncrementDecrementPatcher from './patchers/IncrementDecrementPatcher';
import InOpPatcher from './patchers/InOpPatcher';
import InstanceofOpPatcher from './patchers/InstanceofOpPatcher';
import JavaScriptPatcher from './patchers/JavaScriptPatcher';
import LogicalNotOpPatcher from './patchers/LogicalNotOpPatcher';
import LogicalOpCompoundAssignOpPatcher from './patchers/LogicalOpCompoundAssignOpPatcher';
import LogicalOpPatcher from './patchers/LogicalOpPatcher';
import MemberAccessOpPatcher from './patchers/MemberAccessOpPatcher';
import ModuloOpCompoundAssignOpPatcher from './patchers/ModuloOpCompoundAssignOpPatcher';
import ModuloOpPatcher from './patchers/ModuloOpPatcher';
import NewOpPatcher from './patchers/NewOpPatcher';
import ObjectInitialiserMemberPatcher from './patchers/ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from './patchers/ObjectInitialiserPatcher';
import OfOpPatcher from './patchers/OfOpPatcher';
import ProgramPatcher from './patchers/ProgramPatcher';
import QuasiPatcher from './patchers/QuasiPatcher';
import RangePatcher from './patchers/RangePatcher';
import RegexPatcher from './patchers/RegexPatcher';
import RestPatcher from './patchers/RestPatcher';
import ReturnPatcher from './patchers/ReturnPatcher';
import SeqOpPatcher from './patchers/SeqOpPatcher';
import SlicePatcher from './patchers/SlicePatcher';
import SoakedDynamicMemberAccessOpPatcher from './patchers/SoakedDynamicMemberAccessOpPatcher';
import SoakedFunctionApplicationPatcher from './patchers/SoakedFunctionApplicationPatcher';
import SoakedMemberAccessOpPatcher from './patchers/SoakedMemberAccessOpPatcher';
import SoakedNewOpPatcher from './patchers/SoakedNewOpPatcher';
import SoakedSlicePatcher from './patchers/SoakedSlicePatcher';
import SpreadPatcher from './patchers/SpreadPatcher';
import StringPatcher from './patchers/StringPatcher';
import SuperPatcher from './patchers/SuperPatcher';
import SwitchCasePatcher from './patchers/SwitchCasePatcher';
import SwitchPatcher from './patchers/SwitchPatcher';
import ThisPatcher from './patchers/ThisPatcher';
import ThrowPatcher from './patchers/ThrowPatcher';
import TryPatcher from './patchers/TryPatcher';
import UnaryExistsOpPatcher from './patchers/UnaryExistsOpPatcher';
import UnaryMathOpPatcher from './patchers/UnaryMathOpPatcher';
import UnaryOpPatcher from './patchers/UnaryOpPatcher';
import UnaryTypeofOpPatcher from './patchers/UnaryTypeofOpPatcher';
import WhilePatcher from './patchers/WhilePatcher';
import YieldFromPatcher from './patchers/YieldFromPatcher';
import YieldPatcher from './patchers/YieldPatcher';
import YieldReturnPatcher from './patchers/YieldReturnPatcher';

export default class MainStage extends TransformCoffeeScriptStage {
  patcherConstructorForNode(node: Node): PatcherClass | null {
    switch (node.type) {
      case 'Identifier':
        return IdentifierPatcher;

      case 'String':
        return StringPatcher;

      case 'Int':
      case 'Float':
      case 'Null':
      case 'Undefined':
        return PassthroughPatcher;

      case 'Break':
        return BreakPatcher;

      case 'Continue':
        return ContinuePatcher;

      case 'Quasi':
        return QuasiPatcher;

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

      case 'PostIncrementOp':
      case 'PostDecrementOp':
      case 'PreIncrementOp':
      case 'PreDecrementOp':
        return IncrementDecrementPatcher;

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

      case 'YieldReturn':
        return YieldReturnPatcher;

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
        switch ((node as CompoundAssignOp).op) {
          case 'LogicalAndOp':
          case 'LogicalOrOp':
            return LogicalOpCompoundAssignOpPatcher;

          case 'ExistsOp':
            return ExistsOpCompoundAssignOpPatcher;

          case 'ModuloOp':
            return ModuloOpCompoundAssignOpPatcher;

          case 'FloorDivideOp':
            return FloorDivideOpCompoundAssignOpPatcher;

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

      case 'Regex':
        return RegexPatcher;

      case 'Heregex':
        return HeregexPatcher;

      case 'ExistsOp':
        return ExistsOpPatcher;

      case 'LogicalAndOp':
      case 'LogicalOrOp':
        return LogicalOpPatcher;

      case 'LogicalNotOp':
        return LogicalNotOpPatcher;

      case 'SoakedMemberAccessOp':
        return SoakedMemberAccessOpPatcher;

      case 'SoakedDynamicMemberAccessOp':
        return SoakedDynamicMemberAccessOpPatcher;

      case 'ForIn':
        return ForInPatcher;

      case 'ForOf':
        return ForOfPatcher;

      case 'While':
        return WhilePatcher;

      case 'NewOp':
        return NewOpPatcher;

      case 'SoakedNewOp':
        return SoakedNewOpPatcher;

      case 'InOp':
        return InOpPatcher;

      case 'Slice':
        return SlicePatcher;

      case 'SoakedSlice':
        return SoakedSlicePatcher;

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
