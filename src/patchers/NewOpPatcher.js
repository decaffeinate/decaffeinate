import NodePatcher from './NodePatcher.js';
import type { Node, ParseContext, Editor } from './types.js';

/**
 * Handles construction of objects with `new`.
 */
export default class NewOpPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, ctor: NodePatcher, args: Array<NodePatcher>) {
    super(node, context, editor);
    this.ctor = ctor;
    this.args = args;
  }

  initialize() {
    this.ctor.setRequiresExpression();
    this.args.forEach(arg => arg.setRequiresExpression());
  }

  patch() {
    this.ctor.patch();
    let implicitCall = this.isImplicitCall();
    if (this.args.length > 0) {
      if (implicitCall) {
        this.overwrite(this.ctor.after, this.args[0].before, '(');
      }
      this.args.forEach((arg, i, args) => {
        arg.patch();
        let isLast = i === args.length - 1;
        if (!isLast && !arg.hasTokenAfter(',')) {
          this.insert(arg.after, ',');
        }
      });
      if (implicitCall) {
        this.insert(this.args[this.args.length - 1].after, ')');
      }
    } else if (implicitCall) {
      this.insert(this.ctor.after, '()');
    }
  }

  /**
   * @private
   */
  isImplicitCall(): boolean {
    return this.context.source[this.ctor.after] !== '(';
  }
}
