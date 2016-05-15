import NodePatcher from './../../../patchers/NodePatcher.js';
import replaceTripleQuotes from '../../../utils/replaceTripleQuotes.js';
import { escapeTemplateStringContents } from '../../../utils/escape.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';
import joinMultilineString from '../../../utils/joinMultilineString.js';

export default class TemplateLiteralPatcher extends NodePatcher {
  quasis: Array<NodePatcher>;
  expressions: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, quasis: Array<NodePatcher>, expressions: Array<NodePatcher>) {
    super(node, context, editor);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  patchAsExpression() {
    let { quasis, expressions, contentStart, contentEnd } = this;

    if (this.startsWith('"""')) {
      replaceTripleQuotes(this.node, this.editor);
    } else {
      this.overwrite(contentStart, contentStart + '"'.length, '`');
      this.overwrite(contentEnd - '"'.length, contentEnd, '`');
      joinMultilineString(this, this.node.raw, contentStart);
    }

    for (let i = 0; i < quasis.length - 1; i++) {
      let quasi = quasis[i];
      this.overwrite(quasi.contentEnd, quasi.contentEnd + '#'.length, '$');
    }

    escapeTemplateStringContents(this.editor, contentStart, contentEnd);
    expressions.forEach(expression => expression.patch());
  }
}
