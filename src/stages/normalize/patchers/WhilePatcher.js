import NodePatcher from '../../../patchers/NodePatcher';
import postfixExpressionRequiresParens from '../../../utils/postfixExpressionRequiresParens';
import postfixNodeNeedsOuterParens from '../../../utils/postfixNodeNeedsOuterParens';

import type { PatcherContext } from './../../../patchers/types';

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
  condition: NodePatcher;
  guard: ?NodePatcher;
  body: NodePatcher;
  
  constructor(patcherContext: PatcherContext, condition: NodePatcher, guard: ?NodePatcher, body: NodePatcher) {
    super(patcherContext);
    this.condition = condition;
    this.guard = guard;
    this.body = body;
  }

  patchAsExpression() {
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

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * `BODY 'while' CONDITION ('when' GUARD)?` → `while CONDITION [when GUARD] then BODY`
   * `BODY 'until' CONDITION ('when' GUARD)?` → `until CONDITION [when GUARD] then BODY`
   *
   * @private
   */
  normalize() {
    let patchedCondition = this.slice(
      this.condition.outerStart,
      this.condition.outerEnd
    );
    if (postfixExpressionRequiresParens(patchedCondition) && !this.condition.isSurroundedByParentheses()) {
      patchedCondition = `(${patchedCondition})`;
    }
    let patchedBody = this.slice(
      this.body.outerStart,
      this.body.outerEnd
    );
    let patchedGuard = this.guard ? this.slice(
      this.guard.outerStart,
      this.guard.outerEnd
    ) : null;
    if (patchedGuard !== null && postfixExpressionRequiresParens(patchedGuard) && !this.guard.isSurroundedByParentheses()) {
      patchedGuard = `(${patchedGuard})`;
    }
    let whileToken = this.node.isUntil ? 'until' : 'while';
    let newContent = `${whileToken} ${patchedCondition} ${patchedGuard ? `when ${patchedGuard} ` : ''}then ${patchedBody}`;
    if (postfixNodeNeedsOuterParens(this)) {
      newContent = `(${newContent})`;
    }
    this.overwrite(
      this.contentStart,
      this.contentEnd,
      newContent
    );
  }

  /**
   * @private
   */
  isPostWhile(): boolean {
    return this.condition.contentStart > this.body.contentStart;
  }
}
