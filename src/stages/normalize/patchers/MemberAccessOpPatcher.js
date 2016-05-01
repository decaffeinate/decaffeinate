import PassthroughPatcher from '../../../patchers/PassthroughPatcher.js';

export default class MemberAccessOpPatcher extends PassthroughPatcher {
  shouldTrimContentRange() {
    return true;
  }

  patch() {
    super.patch();
    let cb = this.findAssignMemberCallback();
    if (cb) {
      let content = this.slice(this.contentStart, this.contentEnd);
      this.overwrite(this.contentStart, this.contentEnd, cb(this.node.memberName, content));
    }
  }

  findAssignMemberCallback() {
    let node = this.node;
    // if we traverse up through DefaultParam, we're on the right hand side
    while (node && node.type != 'DefaultParam') {
      if (node._assignMember) return node._assignMember;
      node = node.parentNode;
    }
  }
}
