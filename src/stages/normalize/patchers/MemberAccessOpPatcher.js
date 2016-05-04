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
    let patcher = this.parent;
    // if we traverse up through DefaultParam, we're on the right hand side
    while (patcher && !(patcher instanceof DefaultParamPatcher)) {
      if (patcher.addStatementAtScopeHeader) return patcher.addStatementAtScopeHeader;
      patcher = patcher.parent;
    }
  }
}
