import BinaryOpPatcher from './BinaryOpPatcher.js';
import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

/**
 * Handles equality and inequality comparisons.
 */
export default class EqualityPatcher extends BinaryOpPatcher {
  /**
   * `node` is either `EQOp` or `NEQOp`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, left: NodePatcher, right: NodePatcher) {
    super(node, context, editor, left, right);
    this.negated = false;
  }

  patch() {
    this.left.patch();
    let compareToken = this.getCompareToken();
    this.overwrite(...compareToken.range, this.getCompareOperator());
    this.right.patch();
  }

  getCompareOperator(): string {
    switch (this.node.type) {
      case 'EQOp':
        return this.negated ? '!==' : '===';

      case 'NEQOp':
        return this.negated ? '===' : '!==';

      case 'LTOp':
        return this.negated ? '>=' : '<';

      case 'GTOp':
        return this.negated ? '<=' : '>';

      case 'LTEOp':
        return this.negated ? '>' : '<=';

      case 'GTEOp':
        return this.negated ? '<' : '>=';

      default:
        throw this.error(
          `unsupported equality/inequality type: ${this.node.type}`
        );
    }
  }

  /**
   * @private
   */
  getCompareToken(): Token {
    let { left, right } = this;
    let compareToken = this.tokenBetweenPatchersMatching(left, right, 'COMPARE');

    if (!compareToken) {
      throw this.error(
        'expected COMPARE token but none was found',
        left.after,
        right.before
      );
    }

    return compareToken;
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate() {
    this.negated = !this.negated;
  }
}
