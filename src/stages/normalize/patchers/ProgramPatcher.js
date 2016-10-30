import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';
import determineIndent from '../../../utils/determineIndent.js';

export default class ProgramPatcher extends PassthroughPatcher {
  shouldTrimContentRange() {
    return true;
  }

  /**
   * Gets the indent string used for each indent in this program.
   */
  getProgramIndentString(): string {
    if (!this._indentString) {
      this._indentString = determineIndent(this.context.source);
    }
    return this._indentString;
  }
}
