import NodePatcher from './NodePatcher';

export default class FunctionApplicationPatcher extends NodePatcher {
  constructor(node, context, editor, fn, args) {
    super(node, context, editor);
    this.fn = fn;
    this.args = args;
    fn.setRequiresExpression();
    args.forEach(arg => arg.setRequiresExpression());
  }

  patch() {
    let { fn, args } = this;
    fn.patch();
    args.forEach(arg => arg.patch());
  }
}
