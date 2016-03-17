import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor } from './../../../patchers/types.js';
import { COMMA } from 'coffee-lex';

/**
 * Handles construction of objects with `new`.
 */
export default class NewOpPatcher extends NodePatcher {
  ctor: NodePatcher;
  args: Array<NodePatcher>;
  
  constructor(node: Node, context: ParseContext, editor: Editor, ctor: NodePatcher, args: Array<NodePatcher>) {
    super(node, context, editor);
    this.ctor = ctor;
    this.args = args;
  }

  initialize() {
    this.ctor.setRequiresExpression();
    this.args.forEach(arg => arg.setRequiresExpression());
  }

  patchAsExpression() {
    this.ctor.patch();
    let implicitCall = this.isImplicitCall();
    if (this.args.length > 0) {
      if (implicitCall) {
        this.overwrite(this.ctor.outerEnd, this.args[0].outerStart, '(');
      }
      this.args.forEach((arg, i, args) => {
        arg.patch();
        let isLast = i === args.length - 1;
        if (!isLast && !arg.hasSourceTokenAfter(COMMA)) {
          this.insert(arg.outerEnd, ',');
        }
      });
      if (implicitCall) {
        this.insert(this.args[this.args.length - 1].outerEnd, ')');
      }
    } else if (implicitCall) {
      this.insert(this.ctor.outerEnd, '()');
    }
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * @private
   */
  isImplicitCall(): boolean {
    return this.context.source[this.ctor.outerEnd] !== '(';
  }
}
