import { parse as coffeeScriptParse } from 'coffee-script-redux';
import fixRange from './fixRange';
import traverse from './traverse';
import Scope from './Scope';

/**
 * Parses a CoffeeScript program and cleans up and annotates the AST.
 *
 * @param {string} source
 * @returns {Object} An AST from CoffeeScriptRedux with `scope` and `parent`.
 */
export default function parse(source) {
  const ast = coffeeScriptParse(source, { raw: true }).toBasicObject();
  var offset = 0;
  ast._offset = 0;

  traverse(ast, function(node) {
    switch (node.type) {
      case 'Program':
        node.scope = new Scope();
        break;

      case 'Function':
      case 'BoundFunction':
        node.scope = new Scope(node.parent.scope);
        break;

      default:
        node.scope = node.parent.scope;
        break;
    }

    node.scope.processNode(node);

    if (!node.range || node.raw !== source.slice(node.range[0], node.range[1])) {
      fixRange(node, source, offset);
      offset = node.range[1];
    }
  });

  return ast;
}
