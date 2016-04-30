import Scope from './Scope.js';
import traverse from './traverse.js';
import type { Node } from '../patchers/types.js';
import { parse as decaffeinateParse } from 'decaffeinate-parser';

/**
 * Parses a CoffeeScript program and attaches scope information to the nodes.
 */
export default function parse(source: string): Node {
  let ast = decaffeinateParse(source);
  traverse(ast, attachScope);
  return ast;
}

function attachScope(node: Node) {
  switch (node.type) {
    case 'Program':
      node.scope = new Scope();
      break;

    case 'Function':
    case 'BoundFunction':
    case 'GeneratorFunction':
      node.scope = new Scope(node.parentNode.scope);
      break;

    default:
      node.scope = node.parentNode.scope;
      break;
  }

  node.scope.processNode(node);
}
