import { SourceType, SourceToken } from 'coffee-lex';

import { PatcherContext } from '../../../patchers/types';
import downgradeUnicodeCodePointEscapesInRange from '../../../utils/downgradeUnicodeCodePointEscapesInRange';
import escape from '../../../utils/escape';
import escapeSpecialWhitespaceInRange from '../../../utils/escapeSpecialWhitespaceInRange';
import escapeZeroCharsInRange from '../../../utils/escapeZeroCharsInRange';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import QuasiPatcher from './QuasiPatcher';

export default class InterpolatedPatcher extends NodePatcher {
  quasis: Array<QuasiPatcher>;
  expressions: Array<NodePatcher | null>;

  constructor(patcherContext: PatcherContext, quasis: Array<QuasiPatcher>, expressions: Array<NodePatcher>) {
    super(patcherContext);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  initialize(): void {
    for (const expression of this.expressions) {
      if (expression) {
        expression.setRequiresExpression();
      }
    }
  }

  patchInterpolations(): void {
    for (let i = 0; i < this.expressions.length; i++) {
      const interpolationStart = this.getInterpolationStartTokenAtIndex(i);
      const expression = this.expressions[i];
      if (expression) {
        this.overwrite(interpolationStart.start, interpolationStart.start + 1, '$');
        expression.patch();
      } else {
        const interpolationEndIndex = this.quasis[i + 1].contentStart;
        this.remove(interpolationStart.start, interpolationEndIndex);
      }
    }
  }

  getInterpolationStartTokenAtIndex(index: number): SourceToken {
    const interpolationStartIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.quasis[index].contentEnd,
      this.contentEnd,
      (token) => token.type === SourceType.INTERPOLATION_START,
    );
    if (!interpolationStartIndex) {
      throw this.error('Cannot find interpolation start for string interpolation.');
    }
    const interpolationStart = this.sourceTokenAtIndex(interpolationStartIndex);
    if (!interpolationStart || this.slice(interpolationStart.start, interpolationStart.start + 1) !== '#') {
      throw this.error("Cannot find '#' in interpolation start.");
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
  processContents(): void {
    for (const quasi of this.quasis) {
      const tokens = this.getProgramSourceTokens()
        .slice(quasi.contentStartTokenIndex, notNull(quasi.contentEndTokenIndex.next()))
        .toArray();
      for (const token of tokens) {
        if (token.type === SourceType.STRING_PADDING || token.type === SourceType.HEREGEXP_COMMENT) {
          const paddingCode = this.slice(token.start, token.end);
          const numNewlines = (paddingCode.match(/\n/g) || []).length;
          this.overwrite(token.start, token.end, '\\\n'.repeat(numNewlines));
        } else if (token.type === SourceType.STRING_LINE_SEPARATOR) {
          this.insert(token.start, ' \\');
        } else if (token.type === SourceType.STRING_CONTENT) {
          escapeSpecialWhitespaceInRange(token.start, token.end, this);
          if (this.shouldExcapeZeroChars()) {
            escapeZeroCharsInRange(token.start, token.end, this);
          }
          if (this.shouldDowngradeUnicodeCodePointEscapes()) {
            downgradeUnicodeCodePointEscapesInRange(token.start, token.end, this, { needsExtraEscape: true });
          }
        }
      }
    }
  }

  shouldExcapeZeroChars(): boolean {
    return false;
  }

  shouldDowngradeUnicodeCodePointEscapes(): boolean {
    return false;
  }

  escapeQuasis(skipPattern: RegExp, escapeStrings: Array<string>): void {
    for (const quasi of this.quasis) {
      const tokens = this.getProgramSourceTokens()
        .slice(quasi.contentStartTokenIndex, notNull(quasi.contentEndTokenIndex.next()))
        .toArray();
      for (const token of tokens) {
        if (token.type === SourceType.STRING_CONTENT) {
          escape(this.context.source, this.editor, skipPattern, escapeStrings, token.start, token.end);
        }
      }
    }
  }

  isRepeatable(): boolean {
    return this.expressions.every((patcher) => patcher !== null && patcher.isRepeatable());
  }
}
