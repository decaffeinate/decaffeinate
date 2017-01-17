import { SourceType } from 'coffee-lex';

import ReturnPatcher from './ReturnPatcher';

export default class YieldReturnPatcher extends ReturnPatcher {
  initialize() {
    this.yields();
    super.initialize();
  }

  patchAsStatement() {
    let yieldTokenIndex = this.contentStartTokenIndex;
    let returnTokenIndex = yieldTokenIndex.next();
    let yieldToken = this.sourceTokenAtIndex(yieldTokenIndex);
    let returnToken = this.sourceTokenAtIndex(returnTokenIndex);
    if (yieldToken.type !== SourceType.YIELD || returnToken.type !== SourceType.RETURN) {
      throw this.error('Unexpected token types for `yield return`.');
    }
    this.remove(yieldToken.start, returnToken.start);
    super.patchAsStatement();
  }
}
