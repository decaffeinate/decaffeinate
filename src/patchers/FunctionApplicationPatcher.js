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
    let implicitCall = this.isImplicitCall();
    fn.patch();
    if (implicitCall) {
      this.overwrite(fn.after, args[0].before, '(');
    }
    args.forEach(arg => arg.patch());
    if (implicitCall) {
      this.insertAfter(')');
    }
  }

  isImplicitCall() {
    return !this.fn.hasTokenAfter('CALL_START');
  }
}
