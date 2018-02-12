import NodePatcher from '../../../patchers/NodePatcher';
import {PatcherContext} from '../../../patchers/types';
import BlockPatcher from './BlockPatcher';
import ForInPatcher from './ForInPatcher';

export default class ForFromPatcher extends ForInPatcher {
  constructor(
    patcherContext: PatcherContext, keyAssignee: NodePatcher | null,
    valAssignee: NodePatcher | null, target: NodePatcher, filter: NodePatcher | null,
    body: BlockPatcher
  ) {
    super(patcherContext, keyAssignee, valAssignee, target, null /* step */, filter, body);
  }

  shouldPatchAsForOf(): boolean {
    return true;
  }

  shouldWrapForOfStatementTargetInArrayFrom(): boolean {
    return false;
  }
}
