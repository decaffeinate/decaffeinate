import NodePatcher from './../../../patchers/NodePatcher.js';

export default class ThisPatcher extends NodePatcher {
  patchAsExpression() {
    if (this.isShorthandThis()) {
      this.overwrite(this.contentStart, this.contentEnd, 'this');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  isShorthandThis() {
    return this.context.source.slice(this.contentStart, this.contentEnd) === '@';
  }
}
