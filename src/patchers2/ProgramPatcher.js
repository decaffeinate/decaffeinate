import NodePatcher from './NodePatcher';

export default class ProgramPatcher extends NodePatcher {
  constructor(node, context, editor, body) {
    super(node, context, editor);
    this.body = body;
  }

  patch() {
    let { body } = this;
    body.patch();
  }

  context() {
    return this.node.context;
  }
}
