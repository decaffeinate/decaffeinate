import { parse as coffeeScriptParse } from 'coffee-script-redux';
import traverse from './traverse';
import Scope from './Scope';
import buildLineAndColumnMap from './buildLineAndColumnMap';

/**
 * Parses a CoffeeScript program and cleans up and annotates the AST.
 *
 * @param {string} source
 * @returns {Object} An AST from CoffeeScriptRedux with `scope` and `parent`.
 */
export default function parse(source) {
  const ast = coffeeScriptParse(source, { raw: true }).toBasicObject();
  const map = buildLineAndColumnMap(source);

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
      const fixed = map.getOffset(node.line - 1, node.column - 1);
      node.range = [fixed, fixed + node.raw.length];

      if (node.raw !== source.slice(node.range[0], node.range[1])) {
        throw new Error(
          'BUG! Could not fix range for ' + node.type +
          ' at line ' + node.line + ', column ' + node.column
        );
      }
    }
  });

  return ast;
}
