import { SourceType } from 'coffee-lex';

import notNull from '../../../utils/notNull';
import ReturnPatcher from './ReturnPatcher';

export default class YieldReturnPatcher extends ReturnPatcher {
  initialize(): void {
    this.yields();
    super.initialize();
  }

  patchAsStatement(): void {
    let yieldTokenIndex = this.contentStartTokenIndex;
    let returnTokenIndex = notNull(yieldTokenIndex.next());
    let yieldToken = notNull(this.sourceTokenAtIndex(yieldTokenIndex));
    let returnToken = notNull(this.sourceTokenAtIndex(returnTokenIndex));
    if (yieldToken.type !== SourceType.YIELD || returnToken.type !== SourceType.RETURN) {
      throw this.error('Unexpected token types for `yield return`.');
    }
    this.remove(yieldToken.start, returnToken.start);
    super.patchAsStatement();
  }
}
