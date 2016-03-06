import NodePatcher from './../../../patchers/NodePatcher.js';

export default class ThisPatcher extends NodePatcher {
  patchAsExpression() {
    if (this.isShorthandThis()) {
      this.overwrite(this.start, this.end, 'this');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  isShorthandThis() {
    return this.context.source.slice(this.start, this.end) === '@';
  }
}
