export default function traverse(node, callback) {
  var current = 0;
  var queue = [];

  add(node);

  function add(child) {
    if (child) {
      child.parent = node;
      queue[current++] = child;
    }
  }

  function addAll(arr) {
    for (var i = arr.length; i >= 0; i--) {
      add(arr[i]);
    }
  }

  while (current > 0) {
    current--;
    node = queue[current];
    if (!node) continue;

    callback(node);

    switch (node.type) {
      case 'Identifier':
      case 'String':
      case 'Bool':
      case 'This':
      case 'Int':
        break;

      case 'FunctionApplication':
        addAll(node.arguments);
        add(node.function);
        break;

      case 'Function':
        add(node.body);
        addAll(node.parameters);
        break;

      case 'MemberAccessOp':
        add(node.expression);
        break;

      case 'DynamicMemberAccessOp':
        add(node.indexingExpr);
        add(node.expression);
        break;

      case 'ObjectInitialiser':
      case 'ArrayInitialiser':
        addAll(node.members);
        break;

      case 'ObjectInitialiserMember':
        add(node.expression);
        add(node.key);
        break;

      case 'Block':
        addAll(node.statements);
        break;

      case 'ConcatOp':
        add(node.right);
        add(node.left);
        break;

      case 'NewOp':
        addAll(node.arguments);
        add(node.ctor);
        break;

      case 'SeqOp':
        add(node.right);
        add(node.left);
        break;

      case 'AssignOp':
        add(node.expression);
        add(node.assignee);
        break;

      case 'Program':
        add(node.body);
        break;

      case 'ProtoMemberAccessOp':
        add(node.expression);
        break;

      default:
        throw new Error('unknown node type: ' + node.type);
    }
  }
}
