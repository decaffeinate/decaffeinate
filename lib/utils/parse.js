const CoffeeScript = require('coffee-script-redux');
const fixRange = require('./fixRange').fixRange;
const traverse = require('./traverse').traverse;

function parse(source) {
  const ast = CoffeeScript.parse(source, { raw: true }).toBasicObject();
  ast._offset = 0;

  traverse(ast, function(node) {
    if (node._parent) {
      node.range[0] += node._parent._offset;
      node.range[1] += node._parent._offset;
    }

    if (node.raw !== source.slice(node.range[0], node.range[1])) {
      node._offset = fixRange(node, source);
    } else {
      node._offset = 0;
    }
  });

  return ast;
}
exports.parse = parse;