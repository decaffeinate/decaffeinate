import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';
import DefaultParamPatcher from './DefaultParamPatcher.js';

export default class MemberAccessOpPatcher extends PassthroughPatcher {
  shouldTrimContentRange() {
    return true;
  }

  patch() {
    super.patch();
    let callback = this.findAddStatementCallback();
    if (callback) {
      let content = this.slice(this.contentStart, this.contentEnd);
      this.overwrite(this.contentStart, this.contentEnd, callback(this.node.memberName, content));
    }
  }

  findAddStatementCallback() {
    let patcher = this;

    while (patcher) {
      if (patcher.addStatementAtScopeHeader) {
        return patcher.addStatementAtScopeHeader;
      }
      // Don't traverse up the right side of default params.
      if (patcher.parent instanceof DefaultParamPatcher &&
          patcher.parent.value === patcher) {
        break;
      }
      patcher = patcher.parent;
    }
    return null;
  }
}
