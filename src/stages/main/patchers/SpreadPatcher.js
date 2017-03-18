import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';

/**
 * Handles spread operations, e.g. `a(b...)` or `[a...]`.
 */
export default class SpreadPatcher extends NodePatcher {
  expression: ?NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: ?NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }

  setAssignee() {
    this.expression.setAssignee();
    super.setAssignee();
  }

  /**
   * We need to move the `...` from the right to the left and wrap the
   * expression in Array.from, since CS allows array-like objects and JS
   * requires iterables.
   */
  patchAsExpression() {
    let needsArrayFrom = this.needsArrayFrom();

    // `a...` → `...Array.from(a...`
    //           ^^^^^^^^^^^^^^
    this.insert(this.expression.outerStart, '...');
    if (needsArrayFrom) {
      this.insert(this.expression.outerStart, 'Array.from(');
    }
    this.expression.patch();

    // `...Array.from(a...` → `...Array.from(a`
    //                 ^^^
    this.remove(this.expression.outerEnd, this.contentEnd);
    if (needsArrayFrom) {
      // Replicate a bug in CoffeeScript where you're allowed to pass null or
      // undefined when the argument spread is the only argument.
      if (this.parent instanceof FunctionApplicationPatcher &&
        this.parent.args.length === 1 &&
        this.parent.args[0] === this) {
        this.insert(this.contentEnd, ' || []');
      }
      // `...Array.from(a` → `...Array.from(a)`
      //                                     ^
      this.insert(this.contentEnd, ')');
    }
  }

  needsArrayFrom() {
    // Rest operations should never use Array.from.
    if (this.isAssignee()) {
      return false;
    }
    // Spreading over arguments is always safe.
    if (this.expression.node.type === 'Identifier' &&
        this.expression.node.data === 'arguments') {
      return false;
    }
    return true;
  }
}
