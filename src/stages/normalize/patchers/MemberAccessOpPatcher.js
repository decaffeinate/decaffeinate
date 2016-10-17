import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';
import DefaultParamPatcher from './DefaultParamPatcher.js';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher.js';

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
      // Don't consider this node if we're on the right side of a default param
      // (e.g. `(foo = @bar) ->`) or if we're on the left side of an object
      // destructure (e.g. the logical `a` key in `({@a}) ->`).
      if (patcher.parent instanceof DefaultParamPatcher &&
          patcher.parent.value === patcher) {
        break;
      }
      if (patcher.parent instanceof ObjectInitialiserMemberPatcher &&
          patcher.parent.key === patcher) {
        break;
      }
      patcher = patcher.parent;
    }
    return null;
  }
}
