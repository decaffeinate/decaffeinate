import SourceType from 'coffee-lex/dist/SourceType';
import NodePatcher from './../../../patchers/NodePatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';

/**
 * Handles embedded JavaScript.
 */
export default class JavaScriptPatcher extends NodePatcher {
  /**
   * We need to strip off the backticks and also remove any escape backslashes before backticks.
   */
  patchAsExpression(): void {
    // For any normal surrounding parens, CoffeeScript's rule is to remove them,
    // which allows things like comment-only inline JS. Function call parens
    // should not be removed, though.
    let shouldRemoveSurroundingParens =
      !(this.parent instanceof FunctionApplicationPatcher && this === this.parent.args[0]);

    if (shouldRemoveSurroundingParens) {
      this.remove(this.outerStart, this.contentStart);
    }
    let token = this.firstToken();
    let tokenLength;
    if (token.type === SourceType.JS) {
      tokenLength = 1;
    } else if (token.type === SourceType.HEREJS) {
      tokenLength = 3;
    } else {
      throw this.error(`Unexpected token in JavaScript node: ${token.type}`);
    }

    // '`void 0`' → 'void 0`'
    //  ^
    this.remove(this.contentStart, this.contentStart + tokenLength);

    for (let i = this.contentStart + tokenLength; i < this.contentEnd - tokenLength - 1; i++) {
      if (this.slice(i, i + 2) === '\\`') {
        this.remove(i, i + 1);
      }
    }

    // 'void 0`' → 'void 0'
    //        ^
    this.remove(this.contentEnd - tokenLength, this.contentEnd);
    if (shouldRemoveSurroundingParens) {
      this.remove(this.contentEnd, this.outerEnd);
    }
  }
}
