import NodePatcher from './NodePatcher';

export default class BoolPatcher extends NodePatcher {
  patch() {
    let source = this.slice(this.start, this.end);
    if (source === 'off') {
      this.overwrite(this.start, this.end, 'false');
    } else if (source === 'on') {
      this.overwrite(this.start, this.end, 'true');
    }
  }
}
