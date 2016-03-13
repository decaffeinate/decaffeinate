import NodePatcher from './../../../patchers/NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    switch (this.slice(this.contentStart, this.contentEnd)) {
      case 'off':
      case 'no':
        this.overwrite(this.contentStart, this.contentEnd, 'false');
        break;

      case 'on':
      case 'yes':
        this.overwrite(this.contentStart, this.contentEnd, 'true');
        break;
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
