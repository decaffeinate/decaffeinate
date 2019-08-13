import { SourceType } from 'coffee-lex';
import PassthroughPatcher from '../../../patchers/PassthroughPatcher';
import { PatchOptions, RepeatableOptions } from '../../../patchers/types';
import MemberAccessOpPatcher from './MemberAccessOpPatcher';

export default class ThisPatcher extends PassthroughPatcher {
  /**
   * When patching a shorthand like `@a` as repeatable, we need to add a dot to
   * make the result still syntactically valid.
   */
  patchAsRepeatableExpression(repeatableOptions: RepeatableOptions = {}, patchOptions: PatchOptions = {}): string {
    const ref = super.patchAsRepeatableExpression(repeatableOptions, patchOptions);
    const addedParens = (!this.isRepeatable() || repeatableOptions.forceRepeat) && repeatableOptions.parens;
    if (addedParens && this.parent instanceof MemberAccessOpPatcher) {
      const nextToken = this.nextSemanticToken();
      if (!nextToken || nextToken.type !== SourceType.DOT) {
        this.insert(this.innerEnd, '.');
      }
    }
    return ref;
  }
}
