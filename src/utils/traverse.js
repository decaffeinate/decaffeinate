/**
 * Traverses an AST node, calling a callback for each node in the hierarchy in
 * source order.
 *
 * @param {Object} node
 * @param {function(Object)} callback
 */
export default function traverse(node, callback) {
  callback(node);

  const childNames = ORDER[node.type];

  if (!childNames) {
    throw new Error('cannot traverse unknown node type: ' + node.type);
  }

  childNames.forEach(property => {
    const value = node[property];
    if (Array.isArray(value)) {
      value.forEach(child => {
        child.parent = node;
        traverse(child, callback);
      });
    } else if (value) {
      value.parent = node;
      traverse(value, callback);
    }
  });
}

const ORDER = {
  Program: ['body'],
  ArrayInitialiser: ['members'],
  AssignOp: ['assignee', 'expression'],
  Block: ['statements'],
  Bool: [],
  BoundFunction: ['parameters', 'body'],
  ConcatOp: ['left', 'right'],
  DynamicMemberAccessOp: ['expression', 'indexingExpr'],
  ForIn: ['keyAssignee', 'valAssignee', 'target', 'step', 'filter', 'body'],
  ForOf: ['keyAssignee', 'valAssignee', 'target', 'filter', 'body'],
  Function: ['parameters', 'body'],
  FunctionApplication: ['function', 'arguments'],
  Identifier: [],
  Int: [],
  LogicalAndOp: ['left', 'right'],
  LogicalNotOp: ['expression'],
  LogicalOrOp: ['left', 'right'],
  MemberAccessOp: ['expression'],
  NewOp: ['ctor', 'arguments'],
  ObjectInitialiser: ['members'],
  ObjectInitialiserMember: ['key', 'expression'],
  ProtoMemberAccessOp: ['expression'],
  Return: ['expression'],
  SeqOp: ['left', 'right'],
  String: [],
  This: []
};
