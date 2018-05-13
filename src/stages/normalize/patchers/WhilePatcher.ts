import { While } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import postfixNodeNeedsOuterParens from '../../../utils/postfixNodeNeedsOuterParens';

/**
 * Normalizes `while` loops by rewriting post-`while` into standard `while`, e.g.
 *
 *   a() while b()
 *
 * becomes
 *
 *   while b() then a()
 */
export default class WhilePatcher extends NodePatcher {
  node: While;
  condition: NodePatcher;
  guard: NodePatcher | null;
  body: NodePatcher | null;

  constructor(patcherContext: PatcherContext, condition: NodePatcher, guard: NodePatcher | null, body: NodePatcher) {
    super(patcherContext);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
  }

  patchAsExpression(): void {
    this.condition.patch();
    if (this.guard) {
      this.guard.patch();
    }
    if (this.body) {
      this.body.patch();
    }

    if (this.isPostWhile()) {
      this.normalize();
    }
  }

  patchAsStatement(): void {
    this.patchAsExpression();
  }

  /**
   * `BODY 'while' CONDITION ('when' GUARD)?` → `while CONDITION [when GUARD] then BODY`
   * `BODY 'until' CONDITION ('when' GUARD)?` → `until CONDITION [when GUARD] then BODY`
   *
   * @private
   */
  normalize(): void {
    if (this.body === null) {
      throw this.error('Expected non-null body.');
    }
    let patchedCondition = this.slice(this.condition.outerStart, this.condition.outerEnd);
    if (postfixExpressionRequiresParens(patchedCondition) && !this.condition.isSurroundedByParentheses()) {
      patchedCondition = `(${patchedCondition})`;
    }
    let patchedBody = this.slice(this.body.outerStart, this.body.outerEnd);
    let patchedGuard = null;
    if (this.guard) {
      patchedGuard = this.slice(this.guard.outerStart, this.guard.outerEnd);
      if (postfixExpressionRequiresParens(patchedGuard) && !this.guard.isSurroundedByParentheses()) {
        patchedGuard = `(${patchedGuard})`;
      }
    }
    let whileToken = this.node.isUntil ? 'until' : 'while';
    let newContent = `${whileToken} ${patchedCondition} ${
      patchedGuard ? `when ${patchedGuard} ` : ''
    }then ${patchedBody}`;
    if (postfixNodeNeedsOuterParens(this)) {
      newContent = `(${newContent})`;
    }
    this.overwrite(this.contentStart, this.contentEnd, newContent);
  }

  /**
   * @private
   */
  isPostWhile(): boolean {
    return this.body !== null && this.condition.contentStart > this.body.contentStart;
  }
}
