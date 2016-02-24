import NodePatcher from './NodePatcher.js';

export default class BoolPatcher extends NodePatcher {
  patchAsExpression() {
    switch (this.slice(this.start, this.end)) {
      case 'off':
      case 'no':
        this.overwrite(this.start, this.end, 'false');
        break;

      case 'on':
      case 'yes':
        this.overwrite(this.start, this.end, 'true');
        break;
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }
}
