import { Regex } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import downgradeUnicodeCodePointEscapesInRange from '../../../utils/downgradeUnicodeCodePointEscapesInRange';
import escapeSpecialWhitespaceInRange from '../../../utils/escapeSpecialWhitespaceInRange';

export default class RegexPatcher extends NodePatcher {
  node: Regex;

  patchAsExpression(): void {
    escapeSpecialWhitespaceInRange(this.contentStart + 1, this.contentEnd - 1, this);
    if (!this.node.flags.unicode) {
      downgradeUnicodeCodePointEscapesInRange(this.contentStart + 1, this.contentEnd - 1, this);
    }
  }
}
