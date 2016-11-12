import NodePatcher from './../../../patchers/NodePatcher.js';
import replaceTripleQuotes from '../../../utils/replaceTripleQuotes.js';
import { escapeTemplateStringContents } from '../../../utils/escape.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';
import { INTERPOLATION_START } from 'coffee-lex';

export default class TemplateLiteralPatcher extends NodePatcher {
  quasis: Array<NodePatcher>;
  expressions: Array<NodePatcher>;
  
  constructor(node: Node, context: ParseContext, editor: Editor, quasis: Array<NodePatcher>, expressions: Array<NodePatcher>) {
    super(node, context, editor);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  initialize() {
    for (let expression of this.expressions) {
      expression.setRequiresExpression();
    }
  }

  patchAsExpression() {
    let { quasis, expressions, contentStart, contentEnd } = this;

    if (this.startsWith('"""')) {
      replaceTripleQuotes(this.node, this.editor);
    } else {
      this.overwrite(contentStart, contentStart + '"'.length, '`');
      this.overwrite(contentEnd - '"'.length, contentEnd, '`');
    }

    for (let i = 0; i < expressions.length; i++) {
      let interpolationStartIndex = this.indexOfSourceTokenBetweenPatchersMatching(
        quasis[i], expressions[i], token => token.type === INTERPOLATION_START
      );
      if (!interpolationStartIndex) {
        this.error('Cannot find interpolation start in template literal.');
      }
      let interpolationStart = this.sourceTokenAtIndex(interpolationStartIndex);
      if (!interpolationStart ||
          this.slice(interpolationStart.start, interpolationStart.start + 1) !== '#') {
        this.error("Cannot find '#' in interpolation start.");
      }
      this.overwrite(interpolationStart.start, interpolationStart.start + 1, '$');
    }

    escapeTemplateStringContents(this.editor, contentStart, contentEnd);
    expressions.forEach(expression => expression.patch());
  }
}
