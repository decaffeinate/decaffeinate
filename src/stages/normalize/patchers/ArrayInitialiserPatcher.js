import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import normalizeListItem from '../../../utils/normalizeListItem';

export default class ArrayInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, members: Array<NodePatcher>) {
    super(patcherContext);
    this.members = members;
  }

  patchAsExpression() {
    for (let member of this.members) {
      member.patch();
      normalizeListItem(this, member);
    }
  }
}
