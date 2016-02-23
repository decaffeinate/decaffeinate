import ArrayInitialiserPatcher from './ArrayInitialiserPatcher';
import AssignOpPatcher from './AssignOpPatcher';
import BinaryOpPatcher from './BinaryOpPatcher';
import BlockPatcher from './BlockPatcher';
import BoolPatcher from './BoolPatcher';
import BoundFunctionPatcher from './BoundFunctionPatcher';
import ChainedComparisonOpPatcher from './ChainedComparisonOpPatcher';
import ClassPatcher from './ClassPatcher';
import ClassAssignOpPatcher from './ClassAssignOpPatcher';
import CompoundAssignOpPatcher from './CompoundAssignOpPatcher';
import ConstructorPatcher from './ConstructorPatcher';
import ConditionalPatcher from './ConditionalPatcher';
import DynamicMemberAccessOpPatcher from './DynamicMemberAccessOpPatcher';
import EqualityPatcher from './EqualityPatcher';
import ExistsOpCompoundAssignOpPatcher from './ExistsOpCompoundAssignOpPatcher';
import ExtendsOpPatcher from './ExtendsOpPatcher';
import FloorDivideOpPatcher from './FloorDivideOpPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import FunctionPatcher from './FunctionPatcher';
import HerestringPatcher from './HerestringPatcher';
import IdentifierPatcher from './IdentifierPatcher';
import InOpPatcher from './InOpPatcher';
import InstanceofOpPatcher from './InstanceofOpPatcher';
import LogicalOpPatcher from './LogicalOpPatcher';
import LogicalOpCompoundAssignOpPatcher from './LogicalOpCompoundAssignOpPatcher';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';
import NewOpPatcher from './NewOpPatcher';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher';
import ObjectInitialiserPatcher from './ObjectInitialiserPatcher';
import PassthroughPatcher from './PassthroughPatcher';
import ProgramPatcher from './ProgramPatcher';
import RestPatcher from './RestPatcher';
import ReturnPatcher from './ReturnPatcher';
import SlicePatcher from './SlicePatcher';
import SoakedMemberAccessOpPatcher from './SoakedMemberAccessOpPatcher';
import SpreadPatcher from './SpreadPatcher';
import TemplateLiteralPatcher from './TemplateLiteralPatcher';
import ThisPatcher from './ThisPatcher';
import ThrowPatcher from './ThrowPatcher';
import UnaryOpPatcher from './UnaryOpPatcher';
import { childPropertyNames } from '../utils/traverse';

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
    case 'Super':
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
    case 'LeftShiftOp':
    case 'SignedRightShiftOp':
    case 'UnsignedRightShiftOp':
      return BinaryOpPatcher;

    case 'LogicalAndOp':
    case 'LogicalOrOp':
      return LogicalOpPatcher;

    case 'TemplateLiteral':
      return TemplateLiteralPatcher;

    case 'SoakedMemberAccessOp':
      return SoakedMemberAccessOpPatcher;

    case 'Herestring':
      return HerestringPatcher;

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

    case 'Throw':
      return ThrowPatcher;

    case 'DeleteOp':
    case 'TypeofOp':
    case 'BitNotOp':
      return UnaryOpPatcher;

    case 'ClassProtoAssignOp':
      return ClassAssignOpPatcher;

    case 'Class':
      return ClassPatcher;

    case 'Constructor':
      return ConstructorPatcher;

    case 'Program':
      return ProgramPatcher;

    case 'InstanceofOp':
      return InstanceofOpPatcher;

    case 'ChainedComparisonOp':
      return ChainedComparisonOpPatcher;

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
