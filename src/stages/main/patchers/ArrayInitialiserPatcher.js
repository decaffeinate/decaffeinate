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
      let needsComma = !isLast && !member.hasSourceTokenAfter(SourceType.COMMA);
      member.patch();
      if (needsComma) {
        this.insert(member.outerEnd, ',');
      }
    });
  }
}
