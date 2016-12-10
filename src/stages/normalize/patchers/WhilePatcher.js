import NodePatcher from '../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

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
    let patchedBody = this.slice(
      this.body.outerStart,
      this.body.outerEnd
    );
    let patchedGuard = this.guard ? this.slice(
      this.guard.outerStart,
      this.guard.outerEnd
    ) : null;
    let whileToken = this.node.isUntil ? 'until' : 'while';
    this.overwrite(
      this.contentStart,
      this.contentEnd,
      `${whileToken} ${patchedCondition} ${patchedGuard ? `when ${patchedGuard} ` : ''}then ${patchedBody}`
    );
  }

  /**
   * @private
   */
  isPostWhile(): boolean {
    return this.condition.contentStart > this.body.contentStart;
  }
}
