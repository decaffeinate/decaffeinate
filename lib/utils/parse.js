const CoffeeScript = require('coffee-script-redux');
const fixRange = require('./fixRange').fixRange;
const traverse = require('./traverse').traverse;
const Scope = require('./Scope').Scope;

function parse(source) {
  const ast = CoffeeScript.parse(source, { raw: true }).toBasicObject();
  ast._offset = 0;

  traverse(ast, function(node) {
    if (node.type === 'Program' || node.type === 'Function') {
      node._scope = new Scope(node._parent._scope);
    } else {
      node._scope = node._parent._scope;
    }

    if (node.type === 'AssignOp') {
      node._scope.assigns(node.assignee.data, node.assignee);
    }

    if (node.type === 'Function') {
      node.parameters.forEach(function(parameter) {
        node._scope.declares(parameter.data, parameter);
      });
    }

    if (!node.range) { return; }

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