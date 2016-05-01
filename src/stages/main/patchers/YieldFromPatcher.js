import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';
import { YIELDFROM } from 'coffee-lex';

export default class YieldFromPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  /**
   * YIELD FROM EXPRESSION
   */
  patchAsExpression({ needsParens=true }={}) {
    let from = this.indexOfSourceTokenAfterSourceTokenIndex(this.contentStartTokenIndex, YIELDFROM);
    let fromToken = this.sourceTokenAtIndex(from);
    this.overwrite(this.contentStart, fromToken.end, 'yield*');
    
    this.expression.patch({ needsParens });
    this.yields();
  }
}
