import { PatchOptions } from '../../../patchers/types';
import YieldPatcher from './YieldPatcher';

export default class YieldFromPatcher extends YieldPatcher {
  /**
   * 'yield' 'from' EXPRESSION
   */
  patchAsExpression({ needsParens = true }: PatchOptions = {}): void {
    const firstToken = this.firstToken();
    this.overwrite(firstToken.start, firstToken.end, 'yield*');
    super.patchAsExpression({ needsParens });
  }
}
