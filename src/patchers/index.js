import ArrayInitialiserPatcher from './ArrayInitialiserPatcher.js';
import AssignOpPatcher from './AssignOpPatcher.js';
import BinaryOpPatcher from './BinaryOpPatcher.js';
import BlockPatcher from './BlockPatcher.js';
import BoolPatcher from './BoolPatcher.js';
import BoundFunctionPatcher from './BoundFunctionPatcher.js';
import ChainedComparisonOpPatcher from './ChainedComparisonOpPatcher.js';
import ClassPatcher from './ClassPatcher.js';
import ClassAssignOpPatcher from './ClassAssignOpPatcher.js';
import CompoundAssignOpPatcher from './CompoundAssignOpPatcher.js';
import ConstructorPatcher from './ConstructorPatcher.js';
import ConditionalPatcher from './ConditionalPatcher.js';
import DefaultParamPatcher from './DefaultParamPatcher.js';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher.js';
import EqualityPatcher from './EqualityPatcher.js';
import ExistsOpCompoundAssignOpPatcher from './ExistsOpCompoundAssignOpPatcher.js';
import ExistsOpPatcher from './ExistsOpPatcher.js';
import ExtendsOpPatcher from './ExtendsOpPatcher.js';
import FloorDivideOpPatcher from './FloorDivideOpPatcher.js';
import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';
import FunctionPatcher from './FunctionPatcher.js';
import HerestringPatcher from './HerestringPatcher.js';
import IdentifierPatcher from './IdentifierPatcher.js';
import InOpPatcher from './InOpPatcher.js';
import InstanceofOpPatcher from './InstanceofOpPatcher.js';
import JavaScriptPatcher from './JavaScriptPatcher.js';
import LogicalOpPatcher from './LogicalOpPatcher.js';
import LogicalNotOpPatcher from './LogicalNotOpPatcher.js';
import LogicalOpCompoundAssignOpPatcher from './LogicalOpCompoundAssignOpPatcher.js';
import MemberAccessOpPatcher from './MemberAccessOpPatcher.js';
import NewOpPatcher from './NewOpPatcher.js';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher.js';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher.js';
import OfOpPatcher from './OfOpPatcher.js';
import PassthroughPatcher from './PassthroughPatcher.js';
import ProgramPatcher from './ProgramPatcher.js';
import ProtoMemberAccessOpPatcher from './ProtoMemberAccessOpPatcher.js';
import RangePatcher from './RangePatcher.js';
import RestPatcher from './RestPatcher.js';
import ReturnPatcher from './ReturnPatcher.js';
import SlicePatcher from './SlicePatcher.js';
import SoakedMemberAccessOpPatcher from './SoakedMemberAccessOpPatcher.js';
import SpreadPatcher from './SpreadPatcher.js';
import SuperPatcher from './SuperPatcher.js';
import TemplateLiteralPatcher from './TemplateLiteralPatcher.js';
import ThisPatcher from './ThisPatcher.js';
import ThrowPatcher from './ThrowPatcher.js';
import UnaryExistsOpPatcher from './UnaryExistsOpPatcher.js';
import UnaryOpPatcher from './UnaryOpPatcher.js';
import WhilePatcher from './WhilePatcher.js';
import { childPropertyNames } from '../utils/traverse.js';

export function makePatcher(node, context, editor, constructor=null, allPatchers=[]) {
  if (!constructor) {
    constructor = patcherConstructorForNode(node);
  }

  constructor = constructor.patcherClassOverrideForNode(node) || constructor;

  let props = childPropertyNames(node);
  let children = props.map(name => {
    let child = node[name];
    if (!child) {
      return null;
    } else if (Array.isArray(child)) {
      return child.map(item =>
        makePatcher(
          item,
          context,
          editor,
          constructor.patcherClassForChildNode(item, name),
          allPatchers
        )
      );
    } else {
      return makePatcher(
        child,
        context,
        editor,
        constructor.patcherClassForChildNode(child, name),
        allPatchers
      );
    }
  });

  let patcher = new constructor(node, context, editor, ...children);
  allPatchers.push(patcher);
  associateParent(patcher, children);

  if (node.type === 'Program') {
    allPatchers.forEach(patcher => patcher.initialize());
  }

  return patcher;
}

function patcherConstructorForNode(node): Function {
  switch (node.type) {
    case 'Identifier':
      return IdentifierPatcher;

    case 'String':
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

    case 'Function':
      return FunctionPatcher;

    case 'BoundFunction':
      return BoundFunctionPatcher;

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
      break;

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

    case 'Herestring':
      return HerestringPatcher;

    case 'While':
      return WhilePatcher;

    case 'NewOp':
      return NewOpPatcher;

    case 'InOp':
      return InOpPatcher;

    case 'Slice':
      return SlicePatcher;

    case 'Rest':
      return RestPatcher;

    case 'Spread':
      return SpreadPatcher;

    case 'Range':
      return RangePatcher;

    case 'Throw':
      return ThrowPatcher;

    case 'DeleteOp':
    case 'TypeofOp':
    case 'BitNotOp':
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

    case 'JavaScript':
      return JavaScriptPatcher;

    case 'FloorDivideOp':
      return FloorDivideOpPatcher;

    case 'ExtendsOp':
      return ExtendsOpPatcher;

    default:
      let props = childPropertyNames(node);
      throw new Error(
        `no patcher available for node type: ${node.type}` +
        `${props.length ? ` (props: ${props.join(', ')})` : ''}`
      );
  }
}

function associateParent(parent, child) {
  if (Array.isArray(child)) {
    child.forEach(item => associateParent(parent, item));
  } else if (child) {
    child.parent = parent;
  }
}
