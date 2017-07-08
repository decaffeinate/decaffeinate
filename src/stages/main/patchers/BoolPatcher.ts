import NodePatcher from './../../../patchers/NodePatcher';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression(): void {
    switch (this.getOriginalSource()) {
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

  isRepeatable(): boolean {
    return true;
  }
}
