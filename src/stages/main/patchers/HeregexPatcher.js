import InterpolatedPatcher from './InterpolatedPatcher.js';

const CLOSE_TOKEN_BASE_LENGTH = 3;

export default class HeregexPatcher extends InterpolatedPatcher {
  patchAsExpression() {
    let openToken = this.firstToken();
    let closeToken = this.lastToken();

    this.overwrite(openToken.start, openToken.end, 'new RegExp(`');
    if (closeToken.end - closeToken.start > CLOSE_TOKEN_BASE_LENGTH) {
      // If the close token has flags, e.g. ///gi, keep the flags as a string literal.
      this.overwrite(closeToken.start, closeToken.start + CLOSE_TOKEN_BASE_LENGTH, '`, \'');
      this.insert(closeToken.end, '\')');
    } else {
      // Otherwise, don't specify flags.
      this.overwrite(closeToken.start, closeToken.end, '`)');
    }

    this.patchInterpolations();
    this.removePadding();
    this.escapeQuasis(/^\\\s/, ['`', '${', '\\']);
  }
}
