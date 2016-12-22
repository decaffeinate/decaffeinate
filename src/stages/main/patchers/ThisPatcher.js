import NodePatcher from './../../../patchers/NodePatcher';

export default class ThisPatcher extends NodePatcher {
  patchAsExpression() {
    if (this.isShorthandThis()) {
      this.overwrite(this.contentStart, this.contentEnd, 'this');
    }
  }

  isShorthandThis() {
    return this.getOriginalSource() === '@';
  }

  isRepeatable(): boolean {
    return true;
  }
}
