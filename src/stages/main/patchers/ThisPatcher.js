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

  makeRepeatable(parens: boolean, ref: ?string=null): string { // eslint-disable-line no-unused-vars
    return 'this';
  }
}
