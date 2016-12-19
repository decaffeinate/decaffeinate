import { SourceType } from 'coffee-lex';

import InterpolatedPatcher from './InterpolatedPatcher.js';

/**
 * Patcher to handle all types of strings, whether or not they have
 * interpolations and whether or not they are multiline.
 */
export default class StringPatcher extends InterpolatedPatcher {
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
    } else if (openQuoteToken.type === SourceType.TSSTRING_START) {
      escapeStrings.push('\'');
      this.overwrite(openQuoteToken.start, openQuoteToken.end, '\'');
      this.overwrite(closeQuoteToken.start, closeQuoteToken.end, '\'');
    } else if (openQuoteToken.type === SourceType.TDSTRING_START) {
      escapeStrings.push('"');
      this.overwrite(openQuoteToken.start, openQuoteToken.end, '"');
      this.overwrite(closeQuoteToken.start, closeQuoteToken.end, '"');
    }

    this.patchInterpolations();
    this.removePadding();
    if (escapeStrings.length > 0) {
      this.escapeQuasis(/^\\/, escapeStrings);
    }
  }

  shouldBecomeTemplateLiteral() {
    return this.expressions.length > 0 || this.node.raw.indexOf('\n') > -1;
  }
}
