import NodePatcher from './../../../patchers/NodePatcher.js';
import escape, { escapeTemplateStringContents } from '../../../utils/escape.js';

const HERESTRING_DELIMITER_LENGTH = 3;

export default class HerestringPatcher extends NodePatcher {
  patchAsExpression() {
    let { source } = this.context;
    let contentStart = this.contentStart + HERESTRING_DELIMITER_LENGTH;
    let contentEnd = this.contentEnd - HERESTRING_DELIMITER_LENGTH;

    // Remove the padding.
    let { padding, data } = this.node;
    padding.forEach(([start, end]) => {
      this.remove(start, end);
    });

    if (data.indexOf('\n') >= 0) {
      // Multi-line, so use a template string.
      this.overwrite(this.contentStart, contentStart, '`');
      this.overwrite(contentEnd, this.contentEnd, '`');
      escapeTemplateStringContents(this.editor, contentStart, contentEnd);
    } else {
      // Single-line, so keep the original quotes.
      this.remove(this.contentStart, contentStart - 1);
      this.remove(contentEnd + 1, this.contentEnd);
      escape(this.editor, [source[this.contentStart]], contentStart, contentEnd);
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
