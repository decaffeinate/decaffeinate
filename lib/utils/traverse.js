function traverse(node, source, callback) {
  var current = 0;
  var queue = [];

  node._offset = 0;
  add(node);

  function add(child) {
    if (child) {
      child._parent = node;
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

    node.range[0] += node._parent._offset;
    node.range[1] += node._parent._offset;

    if (node.raw !== source.slice(node.range[0], node.range[1])) {
      node._offset = fixRange(node, source);
    } else {
      node._offset = 0;
    }

    callback(node);

    switch (node.type) {
      case 'Identifier':
      case 'String':
      case 'Bool':
      case 'This':
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
exports.traverse = traverse;

function fixRange(node, source) {
  var index = -1;
  var expectedStart = node.range[0];
  var minimumOffsetIndex = -1;
  var minimumOffset = Infinity;

  while ((index = source.indexOf(node.raw, index + 1)) >= 0) {
    if (minimumOffsetIndex < 0) {
      minimumOffsetIndex = index;
      minimumOffset = Math.abs(expectedStart - minimumOffsetIndex);
    } else {
      var thisOffset = Math.abs(expectedStart - index);
      if (thisOffset < minimumOffset) {
        minimumOffset = thisOffset;
        minimumOffsetIndex = index;
      }
    }
  }

  if (minimumOffsetIndex < 0) {
    throw new Error('unable to find location for node: ' + JSON.stringify(node));
  }

  node.range[0] = minimumOffsetIndex;
  node.range[1] = minimumOffsetIndex + node.raw.length;

  return minimumOffsetIndex - expectedStart;
}
