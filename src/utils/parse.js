import { parse as coffeeScriptParse } from 'coffee-script-redux';
import fixRange from './fixRange';
import traverse from './traverse';
import Scope from './Scope';

export default function parse(source) {
  const ast = coffeeScriptParse(source, { raw: true }).toBasicObject();
  ast._offset = 0;

  traverse(ast, function(node) {
    if (node.type === 'Program' || node.type === 'Function') {
      node.scope = new Scope(node.parent.scope);
    } else {
      node.scope = node.parent.scope;
    }

    node.scope.processNode(node);

    if (!node.range) { return; }

    if (node.parent) {
      node.range[0] += node.parent._offset;
      node.range[1] += node.parent._offset;
    }

    if (node.raw !== source.slice(node.range[0], node.range[1])) {
      node._offset = fixRange(node, source);
    } else {
      node._offset = 0;
    }
  });

  return ast;
}
