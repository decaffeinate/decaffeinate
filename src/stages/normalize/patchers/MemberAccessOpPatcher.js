import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import DefaultParamPatcher from './DefaultParamPatcher';
import ObjectInitialiserMemberPatcher from './ObjectInitialiserMemberPatcher';

export default class MemberAccessOpPatcher extends PassthroughPatcher {
  shouldTrimContentRange() {
    return true;
  }

  patch() {
    super.patch();
    let callback = this.findAddThisAssignmentCallback();
    if (callback) {
      let content = this.slice(this.contentStart, this.contentEnd);
      this.overwrite(this.contentStart, this.contentEnd, callback(this.node.memberName, content));
    }
  }

  findAddThisAssignmentCallback() {
    let patcher = this;

    while (patcher) {
      if (patcher.addThisAssignmentAtScopeHeader) {
        return patcher.addThisAssignmentAtScopeHeader;
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
