import SourceTokenList from 'coffee-lex/dist/SourceTokenList';
import { Block } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import { parse as decaffeinateParse, traverse } from 'decaffeinate-parser';
import { Node, Program } from 'decaffeinate-parser/dist/nodes';
import LinesAndColumns from 'lines-and-columns';
import Scope from './Scope';

/**
 * Class that provides access to various useful things to know about
 * CoffeeScript source code, particularly the decaffeinate-parser AST.
 */
export default class DecaffeinateContext {
  constructor(
    readonly programNode: Program,
    readonly source: string,
    readonly sourceTokens: SourceTokenList,
    readonly coffeeAST: Block,
    readonly linesAndColumns: LinesAndColumns,
    private readonly parentMap: Map<Node, Node | null>,
    private readonly scopeMap: Map<Node, Scope>,
  ) {
  }

  static create(source: string, useCS2: boolean): DecaffeinateContext {
    let program = decaffeinateParse(source, {useCS2});
    return new DecaffeinateContext(
      program,
      source,
      program.context.sourceTokens,
      program.context.ast,
      program.context.linesAndColumns,
      computeParentMap(program),
      computeScopeMap(program)
    );
  }

  getParent(node: Node): Node | null {
    let result = this.parentMap.get(node);
    if (result === undefined) {
      throw new Error('Unexpected parent lookup; node was not in the map.');
    }
    return result;
  }

  getScope(node: Node): Scope {
    let result = this.scopeMap.get(node);
    if (result === undefined) {
      throw new Error('Unexpected scope lookup; node was not in the map.');
    }
    return result;
  }
}

function computeParentMap(program: Program): Map<Node, Node | null> {
  let resultMap: Map<Node, Node | null> = new Map();
  traverse(program, (node, parent) => {
    resultMap.set(node, parent);
  });
  return resultMap;
}

function computeScopeMap(program: Program): Map<Node, Scope> {
  let scopeMap: Map<Node, Scope> = new Map();
  traverse(program, (node, parent) => {
    let scope;
    switch (node.type) {
      case 'Program':
        scope = new Scope(node);
        break;

      case 'Function':
      case 'BoundFunction':
      case 'GeneratorFunction':
      case 'BoundGeneratorFunction':
      case 'Class': {
        let parentScope = parent && scopeMap.get(parent);
        if (!parentScope) {
          throw new Error('Expected to find parent scope.');
        }
        scope = new Scope(node, parentScope);
        break;
      }

      default: {
        let parentScope = parent && scopeMap.get(parent);
        if (!parentScope) {
          throw new Error('Expected to find parent scope.');
        }
        scope = parentScope;
        break;
      }
    }
    scope.processNode(node);
    scopeMap.set(node, scope);
  });
  return scopeMap;
}
