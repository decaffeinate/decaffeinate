import SourceType from 'coffee-lex/dist/SourceType';
import { Identifier } from 'decaffeinate-parser/dist/nodes';
import { PatcherContext } from '../../../patchers/types';
import { REMOVE_ARRAY_FROM } from '../../../suggestions';
import NodePatcher from './../../../patchers/NodePatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';

/**
 * Handles spread operations, e.g. `a(b...)` or `[a...]`.
 */
export default class SpreadPatcher extends NodePatcher {
  expression: NodePatcher;
  
  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize(): void {
    this.expression.setRequiresExpression();
  }

  setAssignee(): void {
    this.expression.setAssignee();
    super.setAssignee();
  }

  /**
   * We need to move the `...` from the right to the left and wrap the
   * expression in Array.from, since CS allows array-like objects and JS
   * requires iterables.
   */
  patchAsExpression(): void {
    let needsArrayFrom = this.needsArrayFrom();
    let isEllipsisOnLHS = this.firstToken().type === SourceType.RANGE;

    if (!isEllipsisOnLHS) {
      // `a...` → `...Array.from(a...`
      //           ^^^^^^^^^^^^^^
      this.insert(this.expression.outerStart, '...');
    }
    if (needsArrayFrom) {
      this.insert(this.expression.outerStart, 'Array.from(');
    }
    this.expression.patch();

    if (!isEllipsisOnLHS) {
      // `...Array.from(a...` → `...Array.from(a`
      //                 ^^^
      this.remove(this.expression.outerEnd, this.contentEnd);
    }
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

  needsArrayFrom(): boolean {
    // CS2 converts spread to JS spread, so Array.from is never necessary.
    if (this.options.useCS2) {
      return false;
    }
    // Rest operations should never use Array.from.
    if (this.isAssignee()) {
      return false;
    }
    // Spreading over arguments is always safe.
    if (this.expression.node instanceof Identifier &&
        this.expression.node.data === 'arguments') {
      return false;
    }
    this.addSuggestion(REMOVE_ARRAY_FROM);
    return true;
  }
}
