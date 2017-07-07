/**
 * Traverses an AST node, calling a callback for each node in the hierarchy in
 * source order.
 */
import { Node } from 'decaffeinate-parser/dist/nodes';

export default function traverse(
  node: Node,
  callback: (node: Node, parent: Node | null) => boolean | void
): void {
  function traverseRec(currentNode: Node, currentParent: Node | null): void {
    let shouldDescend = callback(currentNode, currentParent);
    if (shouldDescend !== false) {
      childPropertyNames(currentNode).forEach(property => {
        let value = currentNode[property];
        if (Array.isArray(value)) {
          value.forEach(child => {
            if (child) {
              traverseRec(child, currentNode);
            }
          });
        } else if (value) {
          traverseRec(value, currentNode);
        }
      });
    }
  }
  traverseRec(node, null);
}

const ORDER: {[nodeType: string]: Array<string> | undefined} = {
  ArrayInitialiser: ['members'],
  AssignOp: ['assignee', 'expression'],
  BareSuperFunctionApplication: [],
  BitAndOp: ['left', 'right'],
  BitNotOp: ['expression'],
  BitOrOp: ['left', 'right'],
  BitXorOp: ['left', 'right'],
  Block: ['statements'],
  Bool: [],
  BoundFunction: ['parameters', 'body'],
  BoundGeneratorFunction: ['parameters', 'body'],
  Break: [],
  ChainedComparisonOp: ['operands'],
  Class: ['nameAssignee', 'parent', 'body'],
  ClassProtoAssignOp: ['assignee', 'expression'],
  CompoundAssignOp: ['assignee', 'expression'],
  Conditional: ['condition', 'consequent', 'alternate'],
  Constructor: ['assignee', 'expression'],
  Continue: [],
  DefaultParam: ['param', 'default'],
  DeleteOp: ['expression'],
  DivideOp: ['left', 'right'],
  DoOp: ['expression'],
  DynamicMemberAccessOp: ['expression', 'indexingExpr'],
  EQOp: ['left', 'right'],
  ExistsOp: ['left', 'right'],
  Expansion: [],
  ExpOp: ['left', 'right'],
  ExtendsOp: ['left', 'right'],
  Float: [],
  FloorDivideOp: ['left', 'right'],
  ForIn: ['keyAssignee', 'valAssignee', 'target', 'step', 'filter', 'body'],
  ForOf: ['keyAssignee', 'valAssignee', 'target', 'filter', 'body'],
  Function: ['parameters', 'body'],
  FunctionApplication: ['function', 'arguments'],
  GeneratorFunction: ['parameters', 'body'],
  GTEOp: ['left', 'right'],
  GTOp: ['left', 'right'],
  Heregex: ['quasis', 'expressions'],
  Identifier: [],
  InOp: ['left', 'right'],
  InstanceofOp: ['left', 'right'],
  Int: [],
  JavaScript: [],
  LTEOp: ['left', 'right'],
  LTOp: ['left', 'right'],
  LeftShiftOp: ['left', 'right'],
  LogicalAndOp: ['left', 'right'],
  LogicalNotOp: ['expression'],
  LogicalOrOp: ['left', 'right'],
  Loop: ['body'],
  MemberAccessOp: ['expression', 'member'],
  ModuloOp: ['left', 'right'],
  MultiplyOp: ['left', 'right'],
  NEQOp: ['left', 'right'],
  NewOp: ['ctor', 'arguments'],
  Null: [],
  ObjectInitialiser: ['members'],
  ObjectInitialiserMember: ['key', 'expression'],
  OfOp: ['left', 'right'],
  PlusOp: ['left', 'right'],
  PostDecrementOp: ['expression'],
  PostIncrementOp: ['expression'],
  PreDecrementOp: ['expression'],
  PreIncrementOp: ['expression'],
  Program: ['body'],
  ProtoMemberAccessOp: ['expression'],
  Quasi: [],
  Range: ['left', 'right'],
  Regex: [],
  RemOp: ['left', 'right'],
  Rest: ['expression'],
  Return: ['expression'],
  SeqOp: ['left', 'right'],
  SignedRightShiftOp: ['left', 'right'],
  Slice: ['expression', 'left', 'right'],
  SoakedDynamicMemberAccessOp: ['expression', 'indexingExpr'],
  SoakedFunctionApplication: ['function', 'arguments'],
  SoakedMemberAccessOp: ['expression', 'member'],
  SoakedNewOp: ['ctor', 'arguments'],
  SoakedProtoMemberAccessOp: ['expression'],
  SoakedSlice: ['expression', 'left', 'right'],
  Spread: ['expression'],
  String: ['quasis', 'expressions'],
  SubtractOp: ['left', 'right'],
  Super: [],
  Switch: ['expression', 'cases', 'alternate'],
  SwitchCase: ['conditions', 'consequent'],
  This: [],
  Throw: ['expression'],
  Try: ['body', 'catchAssignee', 'catchBody', 'finallyBody'],
  TypeofOp: ['expression'],
  UnaryExistsOp: ['expression'],
  UnaryNegateOp: ['expression'],
  UnaryPlusOp: ['expression'],
  Undefined: [],
  UnsignedRightShiftOp: ['left', 'right'],
  While: ['condition', 'guard', 'body'],
  Yield: ['expression'],
  YieldFrom: ['expression'],
  YieldReturn: ['expression'],
};

export function childPropertyNames(node: Node): Array<string> {
  let names = ORDER[node.type];

  if (!names) {
    throw new Error(`cannot traverse unknown node type: ${node.type}`);
  }

  return names;
}
