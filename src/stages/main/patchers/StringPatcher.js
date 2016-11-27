import { INTERPOLATION_START, STRING_LINE_SEPARATOR, STRING_PADDING, TSSTRING_START, TDSTRING_START } from 'coffee-lex';
import repeat from 'repeating';

import NodePatcher from './../../../patchers/NodePatcher.js';
import escape from '../../../utils/escape.js';

/**
 * Patcher to handle all types of strings, whether or not they have
 * interpolations and whether or not they are multiline.
 */
export default class StringPatcher extends NodePatcher {
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
    let shouldBecomeTemplateLiteral = this.shouldBecomeTemplateLiteral();

    let escapeStrings = [];
    let openQuoteToken = this.firstToken();
    let closeQuoteToken = this.lastToken();

    if (shouldBecomeTemplateLiteral) {
      escapeStrings.push('`');
      escapeStrings.push('${');
      this.overwrite(openQuoteToken.start, openQuoteToken.end, '`');
      this.overwrite(closeQuoteToken.start, closeQuoteToken.end, '`');
    } else if (openQuoteToken.type === TSSTRING_START) {
      escapeStrings.push('\'');
      this.overwrite(openQuoteToken.start, openQuoteToken.end, '\'');
      this.overwrite(closeQuoteToken.start, closeQuoteToken.end, '\'');
    } else if (openQuoteToken.type === TDSTRING_START) {
      escapeStrings.push('"');
      this.overwrite(openQuoteToken.start, openQuoteToken.end, '"');
      this.overwrite(closeQuoteToken.start, closeQuoteToken.end, '"');
    }

    for (let i = 0; i < this.expressions.length; i++) {
      let interpolationStart = this.getInterpolationStartTokenAtIndex(i);
      this.overwrite(interpolationStart.start, interpolationStart.start + 1, '$');
      this.expressions[i].patch();
    }

    this.removePadding();

    if (escapeStrings.length > 0) {
      for (let quasi of this.quasis) {
        escape(
          this.editor,
          escapeStrings,
          // For now, clamp the quasi bounds to be strictly between the quotes.
          // Ideally, decaffeinate-parser would provide better location data
          // that would make this unnecessary.
          Math.max(quasi.contentStart, openQuoteToken.end),
          Math.min(quasi.contentEnd, closeQuoteToken.start),
        );
      }
    }
  }

  getInterpolationStartTokenAtIndex(index: number): SourceToken {
    let interpolationStartIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.quasis[index], this.expressions[index], token => token.type === INTERPOLATION_START
    );
    if (!interpolationStartIndex) {
      this.error('Cannot find interpolation start for string interpolation.');
    }
    let interpolationStart = this.sourceTokenAtIndex(interpolationStartIndex);
    if (!interpolationStart ||
      this.slice(interpolationStart.start, interpolationStart.start + 1) !== '#') {
      this.error("Cannot find '#' in interpolation start.");
    }
    return interpolationStart;
  }

  /**
   * Handle "padding" characters: characters like leading whitespace that should
   * be removed according to the lexing rules. In addition to STRING_PADDING
   * tokens, which indicate that the range should be removed, there are also
   * STRING_LINE_SEPARATOR tokens that indicate that the newlines should be
   * replace with a space.
   *
   * To preserve the formatting of multiline strings a little better, newline
   * characters are escaped rather than removed.
   */
  removePadding() {
    for (let quasi of this.quasis) {
      let tokens = this.getProgramSourceTokens().slice(
        quasi.contentStartTokenIndex, quasi.contentEndTokenIndex.next()).toArray();
      for (let token of tokens) {
        if (token.type === STRING_PADDING) {
          let paddingCode = this.slice(token.start, token.end);
          let numNewlines = (paddingCode.match(/\n/g) || []).length;
          this.overwrite(token.start, token.end, repeat('\\\n', numNewlines));
        } else if (token.type === STRING_LINE_SEPARATOR) {
          this.insert(token.start, ' \\');
        }
      }
    }
  }

  isRepeatable() {
    return this.expressions.every(patcher => patcher.isRepeatable());
  }

  shouldBecomeTemplateLiteral() {
    return this.expressions.length > 0 || this.node.raw.indexOf('\n') > -1;
  }
}
