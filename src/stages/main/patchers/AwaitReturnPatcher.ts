import { SourceType } from 'coffee-lex';

import notNull from '../../../utils/notNull';
import ReturnPatcher from './ReturnPatcher';

export default class AwaitReturnPatcher extends ReturnPatcher {
  initialize(): void {
    this.awaits();
    super.initialize();
  }

  patchAsStatement(): void {
    const awaitTokenIndex = this.contentStartTokenIndex;
    const returnTokenIndex = notNull(awaitTokenIndex.next());
    const awaitToken = notNull(this.sourceTokenAtIndex(awaitTokenIndex));
    const returnToken = notNull(this.sourceTokenAtIndex(returnTokenIndex));
    if (awaitToken.type !== SourceType.IDENTIFIER || returnToken.type !== SourceType.RETURN) {
      throw this.error('Unexpected token types for `await return`.');
    }
    this.remove(awaitToken.start, returnToken.start);
    super.patchAsStatement();
  }
}
