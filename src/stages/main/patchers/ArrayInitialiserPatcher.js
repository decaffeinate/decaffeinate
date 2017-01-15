import ExpansionPatcher from './ExpansionPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class ArrayInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, members: Array<NodePatcher>) {
    super(patcherContext);
    this.members = members;
  }

  initialize() {
    this.members.forEach(member => member.setRequiresExpression());
  }

  patchAsExpression() {
    this.members.forEach((member, i, members) => {
      let isLast = i === members.length - 1;

      // An expansion in a final position is a no-op, so just remove it.
      if (isLast && member instanceof ExpansionPatcher) {
        this.remove(members[i - 1].outerEnd, member.outerEnd);
        return;
      }

      let needsComma = !isLast && !member.hasSourceTokenAfter(SourceType.COMMA);
      member.patch();
      if (needsComma) {
        this.insert(member.outerEnd, ',');
      }
    });
  }
}
