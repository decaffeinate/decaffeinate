import NodePatcher from '../../../patchers/NodePatcher';

/**
 * Handles regexes and heregexes (e.g. `/\.js$/` and `///a/b/c///`).
 */
export default class RegExpPatcher extends NodePatcher {
  patchAsExpression() {
    this.overwrite(this.contentStart, this.contentEnd, this.node.data);
  }
}
