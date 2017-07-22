import { MemberAccessOp } from 'decaffeinate-parser/dist/nodes';
import NodePatcher, { AddThisAssignmentCallback } from '../../../patchers/NodePatcher';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import { PatcherContext } from '../../../patchers/types';
import DefaultParamPatcher from './DefaultParamPatcher';
import IdentifierPatcher from './IdentifierPatcher';

export default class MemberAccessOpPatcher extends PassthroughPatcher {
  node: MemberAccessOp;
  expression: NodePatcher;
  member: IdentifierPatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher, member: IdentifierPatcher) {
    super(patcherContext, expression, member);
    this.expression = expression;
    this.member = member;
  }

  shouldTrimContentRange(): boolean {
    return true;
  }

  patch(): void {
    super.patch();
    let callback = this.findAddThisAssignmentCallback();
    if (callback) {
      this.overwrite(this.contentStart, this.contentEnd, callback(this.node.member.data));
    }
  }

  findAddThisAssignmentCallback(): AddThisAssignmentCallback | null {
    let patcher: NodePatcher | null = this;

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
      patcher = patcher.parent;
    }
    return null;
  }
}
