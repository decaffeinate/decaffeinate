function visit(node, iterator, path) {
  path = path || [];

  var traversed = false;
  function traverse(n) {
    traversed = true;
    n.eachChild(function(child) {
      visit(child, iterator, [n].concat(path));
    });
  }

  const continues = iterator(node, path, traverse);

  if (continues !== false && !traversed) {
    traverse(node);
  }
}
exports.visit = visit;

function type(node) {
  return node.constructor.name;
}
exports.type = type;

function isType(typeName, node) {
  return type(node) === typeName;
}
exports.isType = isType;

function isArr(node) {
  return isType('Arr', node);
}
exports.isArr = isArr;

function isValue(node) {
  return isType('Value', node);
}
exports.isValue = isValue;

function isObj(node) {
  return isType('Obj', node);
}
exports.isObj = isObj;

function isCall(node) {
  return isType('Call', node);
}
exports.isCall = isCall;

function isCode(node) {
  return isType('Code', node);
}
exports.isCode = isCode;

function isOp(node) {
  return isType('Op', node);
}
exports.isOp = isOp;

function isLiteral(node) {
  return isType('Literal', node);
}
exports.isLiteral = isLiteral;

/**
 * CoffeeScript represents 'new' expressions as either Call or Op:
 *
 *   new Foo    ===   Op 'new' (Literal 'Foo')
 *   new Foo()  ===   Call isNew=true (Literal 'Foo')
 *
 * @param {*} node
 * @returns {boolean}
 */
function isNew(node) {
  if (isCall(node)) {
    return node.isNew;
  } else if (isOp(node)) {
    return node.operator === 'new';
  } else {
    return false;
  }
}
exports.isNew = isNew;

function splitCall(node) {
  if (isCall(node)) {
    return [node.variable, node.args];
  } else if (isOp(node) && node.operator === 'new') {
    return [node.first, []];
  } else {
    return null;
  }
}
exports.splitCall = splitCall;

function isComment(node) {
  return isType('Comment', node);
}
exports.isComment = isComment;
