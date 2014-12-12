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

function isObj(node) {
  return isType('Obj', node);
}
exports.isObj = isObj;

function isCall(node) {
  return isType('Call', node);
}
exports.isCall = isCall;

function isComment(node) {
  return isType('Comment', node);
}
exports.isComment = isComment;
