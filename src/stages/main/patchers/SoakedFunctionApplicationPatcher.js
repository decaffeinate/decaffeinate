import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';
import { SourceTokenListIndex, CALL_START, EXISTENCE } from 'coffee-lex';

export default class SoakedFunctionApplicationPatcher extends FunctionApplicationPatcher {

  patchAsExpression() {
    this.insert(this.outerStart, `typeof ${this.fn.getOriginalSource()} === 'function') ? `);
    super.patchAsExpression();
    let existenceToken = this.sourceTokenAtIndex(this.existenceTokenIndex());
    this.remove(existenceToken.start, existenceToken.end);
    this.insert(this.outerEnd, ` : undefined`);
  }

  patchAsStatement() {
    this.insert(this.outerStart, `if (typeof ${this.fn.getOriginalSource()} === 'function') {\n${this.fn.getIndent()}`);
    this.indent();
    super.patchAsExpression();
    let existenceToken = this.sourceTokenAtIndex(this.existenceTokenIndex());
    this.remove(existenceToken.start, existenceToken.end);
    this.appendLineAfter('}', -1);
  }

  isImplicitCall(): boolean {
    let postExistenceToken = this.existenceTokenIndex().next();
    return postExistenceToken.type === CALL_START;
  }

  existenceTokenIndex(): SourceTokenListIndex {
    let existenceToken = this.sourceTokenAtIndex(this.fn.outerEndTokenIndex.next());

    if (existenceToken.type === EXISTENCE) {
      return this.fn.outerEndTokenIndex.next();
    } else {
      throw this.error(`The source token in after a soaked function should be EXISTENCE but was a ${existenceToken.type}`);
    }
  }
}
