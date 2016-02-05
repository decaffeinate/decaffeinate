import NodePatcher from './NodePatcher';
import type { Token } from './types';

export default class EQOpPatcher extends NodePatcher {
  constructor(node, context, editor, left, right) {
    super(node, context, editor);
    this.left = left;
    this.right = right;
    this.negated = false;
  }

  patch() {
    let { left, right } = this;
    left.patch();
    let eqToken = this.getEqualToken();
    this.overwrite(
      ...eqToken.range,
      this.negated ? '!==' : '==='
    );
    right.patch();
  }

  /**
   * @private
   */
  getEqualToken(): Token {
    let { left, right } = this;
    let eqToken = this.tokenBetweenPatchersMatching(left, right, 'COMPARE');

    if (!eqToken) {
      throw this.error(
        'expected COMPARE token but none was found',
        left.after,
        right.before
      );
    }

    return eqToken;
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate() {
    this.negated = !this.negated;
  }
}
