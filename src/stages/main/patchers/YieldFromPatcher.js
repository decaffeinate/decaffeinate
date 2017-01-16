import YieldPatcher from './YieldPatcher';

export default class YieldFromPatcher extends YieldPatcher {
  /**
   * 'yield' 'from' EXPRESSION
   */
  patchAsExpression({ needsParens=true }={}) {
    let src = this.sourceTokenAtIndex(this.contentStartTokenIndex);
    this.overwrite(src.start, src.end, 'yield*');
    super.patchAsExpression({ needsParens });
  }
}
