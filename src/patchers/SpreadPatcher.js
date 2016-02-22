import NodePatcher from './NodePatcher';
import type { Editor, Node, ParseContext } from './types';

/**
 * Handles spread operations, e.g. `a(b...)` or `[a...]`.
 */
export default class SpreadPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: ?NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  /**
   * All we have to do is move the `...` from the right to the left.
   */
  patchAsExpression() {
    // `a...` → `...a...`
    //           ^^^
    this.insert(this.expression.before, '...');
    this.expression.patch();
    // `...a...` → `...a`
    //      ^^^
    this.remove(this.expression.after, this.end);
  }
}
