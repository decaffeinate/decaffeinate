import NodePatcher from './../../../patchers/NodePatcher';
import normalizeListItem from '../../../utils/normalizeListItem';
import type { PatcherContext } from './../../../patchers/types';

/**
 * Handles object literals.
 */
export default class ObjectInitialiserPatcher extends NodePatcher {
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
