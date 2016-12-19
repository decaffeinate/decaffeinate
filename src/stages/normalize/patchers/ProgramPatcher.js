import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import determineIndent from '../../../utils/determineIndent';

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
