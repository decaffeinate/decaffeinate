import NodePatcher from './NodePatcher';

export default class ArrayInitialiserPatcher extends NodePatcher {
  constructor(node, context, editor, members) {
    super(node, context, editor);
    this.members = members;
  }

  patch() {
    let { members } = this;
    members.forEach((member, i) => {
      let isLast = i === members.length - 1;
      let needsComma = !isLast && !member.hasTokenAfter(',');
      member.patch();
      if (needsComma) {
        member.insertAfter(',');
      }
    });
  }
}
