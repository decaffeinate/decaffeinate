import NodePatcher from './NodePatcher.js';

export default class ThisPatcher extends NodePatcher {
  patch() {
    if (this.isShorthandThis()) {
      this.overwrite(this.start, this.end, 'this');
    }
  }

  isShorthandThis() {
    return this.context.source.slice(this.start, this.end) === '@';
  }
}
