import NodePatcher from './../../../patchers/NodePatcher';
import type { MakeRepeatableOptions } from '../../../patchers/types';

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

  makeRepeatable(options: MakeRepeatableOptions = {}): string { // eslint-disable-line no-unused-vars
    return 'this';
  }
}
