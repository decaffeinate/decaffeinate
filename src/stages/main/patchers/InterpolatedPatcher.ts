import { SourceType } from 'coffee-lex';

import SourceToken from 'coffee-lex/dist/SourceToken';
import { PatcherContext } from '../../../patchers/types';
import escape from '../../../utils/escape';
import escapeSpecialWhitespaceInRange from '../../../utils/escapeSpecialWhitespaceInRange';
import escapeZeroCharsInRange from '../../../utils/escapeZeroCharsInRange';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';

export default class InterpolatedPatcher extends NodePatcher {
  quasis: Array<NodePatcher>;
  expressions: Array<NodePatcher | null>;

  constructor(patcherContext: PatcherContext, quasis: Array<NodePatcher>, expressions: Array<NodePatcher>) {
    super(patcherContext);
    this.quasis = quasis;
    this.expressions = expressions;
  }

  initialize(): void {
    for (let expression of this.expressions) {
      if (expression) {
        expression.setRequiresExpression();
      }
    }
  }

  patchInterpolations(): void {
    for (let i = 0; i < this.expressions.length; i++) {
      let interpolationStart = this.getInterpolationStartTokenAtIndex(i);
      let expression = this.expressions[i];
      if (expression) {
        this.overwrite(interpolationStart.start, interpolationStart.start + 1, '$');
        expression.patch();
      } else {
        let interpolationEndIndex = this.quasis[i + 1].contentStart;
        this.remove(interpolationStart.start, interpolationEndIndex);
      }
    }
  }

  getInterpolationStartTokenAtIndex(index: number): SourceToken {
    let interpolationStartIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.quasis[index].contentEnd, this.contentEnd, token => token.type === SourceType.INTERPOLATION_START
    );
    if (!interpolationStartIndex) {
      throw this.error('Cannot find interpolation start for string interpolation.');
    }
    let interpolationStart = this.sourceTokenAtIndex(interpolationStartIndex);
    if (!interpolationStart ||
        this.slice(interpolationStart.start, interpolationStart.start + 1) !== '#') {
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
    for (let quasi of this.quasis) {
      let tokens = this.getProgramSourceTokens().slice(
        quasi.contentStartTokenIndex, notNull(quasi.contentEndTokenIndex.next())).toArray();
      for (let token of tokens) {
        if (token.type === SourceType.STRING_PADDING) {
          let paddingCode = this.slice(token.start, token.end);
          let numNewlines = (paddingCode.match(/\n/g) || []).length;
          this.overwrite(token.start, token.end, '\\\n'.repeat(numNewlines));
        } else if (token.type === SourceType.STRING_LINE_SEPARATOR) {
          this.insert(token.start, ' \\');
        } else if (token.type === SourceType.STRING_CONTENT) {
          escapeSpecialWhitespaceInRange(token.start, token.end, this);
          if (this.shouldExcapeZeroChars()) {
            escapeZeroCharsInRange(token.start, token.end, this);
          }
        }
      }
    }
  }

  shouldExcapeZeroChars(): boolean {
    return false;
  }

  escapeQuasis(skipPattern: RegExp, escapeStrings: Array<string>): void {
    for (let quasi of this.quasis) {
      let tokens = this.getProgramSourceTokens().slice(
        quasi.contentStartTokenIndex, notNull(quasi.contentEndTokenIndex.next())).toArray();
      for (let token of tokens) {
        if (token.type === SourceType.STRING_CONTENT) {
          escape(this.context.source, this.editor, skipPattern, escapeStrings, token.start, token.end);
        }
      }
    }
  }

  isRepeatable(): boolean {
    return this.expressions.every(patcher => patcher !== null && patcher.isRepeatable());
  }
}
