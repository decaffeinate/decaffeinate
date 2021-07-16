import { PatchOptions } from '../../../patchers/types';
import BinaryOpPatcher from './BinaryOpPatcher';
import ExistsOpPatcher from './ExistsOpPatcher';

export default class NullishCoalescingExistsOpPatcher extends ExistsOpPatcher {
  /**
   * LEFT '?' RIGHT → `LEFT ?? RIGHT`
   */
  patchAsExpression(options: PatchOptions = {}): void {
    const needsTypeofCheck = this.left.mayBeUnboundReference();
    if (needsTypeofCheck) {
      super.patchAsExpression(options);
    } else {
      BinaryOpPatcher.prototype.patchAsExpression.call(this, options);
    }
  }

  patchOperator(): void {
    const opToken = this.getOperatorToken();
    this.overwrite(opToken.start, opToken.end, '??');
  }
}
