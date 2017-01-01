import { SourceType } from 'coffee-lex';
import repeat from 'repeating';

import NodePatcher from './../../../patchers/NodePatcher';
import escape from '../../../utils/escape';
import escapeSpecialWhitespaceInRange from '../../../utils/escapeSpecialWhitespaceInRange';

export default class InterpolatedPatcher extends NodePatcher {
  quasis: Array<NodePatcher>;
  expressions: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, quasis: Array<NodePatcher>, expressions: Array<NodePatcher>) {
    super(patcherContext);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  initialize() {
    for (let expression of this.expressions) {
      expression.setRequiresExpression();
    }
  }

  patchInterpolations() {
    for (let i = 0; i < this.expressions.length; i++) {
      let interpolationStart = this.getInterpolationStartTokenAtIndex(i);
      this.overwrite(interpolationStart.start, interpolationStart.start + 1, '$');
      this.expressions[i].patch();
    }
  }

  getInterpolationStartTokenAtIndex(index: number): SourceToken {
    let interpolationStartIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.quasis[index], this.expressions[index], token => token.type === SourceType.INTERPOLATION_START
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
   * replaced with a space.
   *
   * To preserve the formatting of multiline strings a little better, newline
   * characters are escaped rather than removed.
   *
   * Also change any \u2028 and \u2029 characters we see into their unicode
   * escape form.
   */
  processContents() {
    for (let quasi of this.quasis) {
      let tokens = this.getProgramSourceTokens().slice(
        quasi.contentStartTokenIndex, quasi.contentEndTokenIndex.next()).toArray();
      for (let token of tokens) {
        if (token.type === SourceType.STRING_PADDING) {
          let paddingCode = this.slice(token.start, token.end);
          let numNewlines = (paddingCode.match(/\n/g) || []).length;
          this.overwrite(token.start, token.end, repeat('\\\n', numNewlines));
        } else if (token.type === SourceType.STRING_LINE_SEPARATOR) {
          this.insert(token.start, ' \\');
        } else if (token.type === SourceType.STRING_CONTENT) {
          escapeSpecialWhitespaceInRange(token.start, token.end, this);
        }
      }
    }
  }

  escapeQuasis(skipPattern, escapeStrings) {
    for (let quasi of this.quasis) {
      escape(
        this.editor,
        skipPattern,
        escapeStrings,
        // For now, clamp the quasi bounds to be strictly between the quotes.
        // Ideally, decaffeinate-parser would provide better location data
        // that would make this unnecessary.
        Math.max(quasi.contentStart, this.firstToken().end),
        Math.min(quasi.contentEnd, this.lastToken().start),
      );
    }
  }

  isRepeatable() {
    return this.expressions.every(patcher => patcher.isRepeatable());
  }
}
