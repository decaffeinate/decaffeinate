import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

/**
 * Handles logical AND and logical OR.
 *
 * This class is primarily responsible for rewriting `and` to `&&` and `or` to
 * `||`. It also applies De Morgan's laws [1] in the event of negation, such as
 * when used as the condition of an `unless` expression:
 *
 *   a unless b && c  # equivalent to `a if !b || !c`
 *
 * [1]: https://en.wikipedia.org/wiki/De_Morgan%27s_laws
 */
export default class LogicalOpPatcher extends NodePatcher {
  /**
   * `node` is expected to be either `LogicalAndOp` or `LogicalOrOp`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
    this.logicToken = this.tokenBetweenPatchersMatching(this.left, this.right, 'LOGIC');
    this.replacement = this.logicToken.data;
  }

  /**
   * LEFT OP RIGHT
   */
  patch() {
    let { left, right, replacement, logicToken } = this;
    left.patch();
    this.overwrite(...logicToken.range, replacement);
    right.patch();
  }

  /**
   * Apply De Morgan's law.
   */
  negate() {
    this.replacement = this.replacement === '&&' ? '||' : '&&';
    this.left.negate();
    this.right.negate();
  }
}
