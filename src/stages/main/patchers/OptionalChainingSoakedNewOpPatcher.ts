import OptionalChainingSoakedFunctionApplicationPatcher from './OptionalChainingSoakedFunctionApplicationPatcher';

/**
 * Patches soaked new operations while targeting optional chaining. This is
 * not allowed in JavaScript, so all this patcher does is fail with a
 * descriptive error message.
 */
export default class OptionalChainingSoakedNewOpPatcher extends OptionalChainingSoakedFunctionApplicationPatcher {
  patchAsExpression(): void {
    throw this.error(
      `JavaScript does not allow constructors with optional chaining. Run without --optional-chaining or edit the original source to manually invoke the constructor conditionally.`,
    );
  }
}
