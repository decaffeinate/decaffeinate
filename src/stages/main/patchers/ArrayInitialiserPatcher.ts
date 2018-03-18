import { SourceType } from 'coffee-lex';
import { PatcherContext } from '../../../patchers/types';
import NodePatcher from './../../../patchers/NodePatcher';
import ElisionPatcher from './ElisionPatcher';
import ExpansionPatcher from './ExpansionPatcher';

export default class ArrayInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, members: Array<NodePatcher>) {
    super(patcherContext);
    this.members = members;
  }

  initialize(): void {
    this.members.forEach(member => member.setRequiresExpression());
  }

  setAssignee(): void {
    this.members.forEach(member => member.setAssignee());
    super.setAssignee();
  }

  patchAsExpression(): void {
    this.members.forEach((member, i, members) => {
      let isLast = i === members.length - 1;

      // An expansion in a final position is a no-op, so just remove it.
      if (isLast && member instanceof ExpansionPatcher) {
        this.remove(members[i - 1].outerEnd, member.outerEnd);
        return;
      }

      let needsComma = !isLast &&
        !member.hasSourceTokenAfter(SourceType.COMMA) &&
        !(member instanceof ElisionPatcher);
      member.patch();
      if (needsComma) {
        this.insert(member.outerEnd, ',');
      }
    });
  }

  isPure(): boolean {
    return this.members.every(member => member.isPure());
  }
}
