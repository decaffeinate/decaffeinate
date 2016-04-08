import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { COMMA } from 'coffee-lex';

export default class ArrayInitialiserPatcher extends NodePatcher {
  members: Array<NodePatcher>;
  
  constructor(node: Node, context: ParseContext, editor: Editor, members: Array<NodePatcher>) {
    super(node, context, editor);
    this.members = members;
  }

  initialize() {
    this.members.forEach(member => member.setRequiresExpression());
  }

  patchAsExpression() {
    this.members.forEach((member, i, members) => {
      let isLast = i === members.length - 1;
      let needsComma = !isLast && !member.hasSourceTokenAfter(COMMA);
      member.patch();
      if (needsComma) {
        this.insert(member.outerEnd, ',');
      }
    });
  }
}
