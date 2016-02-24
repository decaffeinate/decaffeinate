import NodePatcher from './NodePatcher.js';
import replaceTripleQuotes from '../utils/replaceTripleQuotes.js';
import { escapeTemplateStringContents } from '../utils/escape.js';
import type { Node, ParseContext, Editor } from './types.js';

export default class TemplateLiteralPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, quasis: Array<NodePatcher>, expressions: Array<NodePatcher>) {
    super(node, context, editor);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  patch() {
    let { quasis, expressions, start, end } = this;

    if (this.startsWith('"""')) {
      replaceTripleQuotes(this.node, this.editor);
    } else {
      this.overwrite(start, start + '"'.length, '`');
      this.overwrite(end - '"'.length, end, '`');
    }

    for (let i = 0; i < quasis.length - 1; i++) {
      let quasi = quasis[i];
      this.overwrite(quasi.end, quasi.end + '#'.length, '$');
    }

    escapeTemplateStringContents(this.editor, start, end);
    expressions.forEach(expression => expression.patch());
  }
}
