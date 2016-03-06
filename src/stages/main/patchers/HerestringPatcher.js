import NodePatcher from './NodePatcher.js';
import escape, { escapeTemplateStringContents } from '../../../utils/escape.js';

const HERESTRING_DELIMITER_LENGTH = 3;

export default class HerestringPatcher extends NodePatcher {
  patchAsExpression() {
    let { source } = this.context;
    let contentStart = this.start + HERESTRING_DELIMITER_LENGTH;
    let contentEnd = this.end - HERESTRING_DELIMITER_LENGTH;

    // Remove the padding.
    let { padding, data } = this.node;
    padding.forEach(([start, end]) => {
      this.remove(start, end);
    });

    if (data.indexOf('\n') >= 0) {
      // Multi-line, so use a template string.
      this.overwrite(this.start, contentStart, '`');
      this.overwrite(contentEnd, this.end, '`');
      escapeTemplateStringContents(this.editor, contentStart, contentEnd);
    } else {
      // Single-line, so keep the original quotes.
      this.remove(this.start, contentStart - 1);
      this.remove(contentEnd + 1, this.end);
      escape(this.editor, [source[this.start]], contentStart, contentEnd);
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
