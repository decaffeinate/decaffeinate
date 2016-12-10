import BinaryOpPatcher from './BinaryOpPatcher.js';
import type NodePatcher from './../../../patchers/NodePatcher.js';
import type { PatcherContext } from './../../../patchers/types.js';

const MOD_HELPER =
  `function __mod__(a, b) {
  a = +a;
  b = +b;
  return (a % b + b) % b;
}`;

/**
 * Handles modulo operator, e.g. `a %% b`.
 */
export default class ModuloOpPatcher extends BinaryOpPatcher {
  /**
   * `node` is of type `ModuloOp`.
   */
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext, left, right);
  }

  patchAsExpression() {
    let helper = this.registerHelper('__mod__', MOD_HELPER);

    // `a %% b` → `__mod__(a %% b`
    //             ^^^^^^^^
    this.insert(this.left.outerStart, `${helper}(`);

    this.left.patch();

    // `__mod__(a %% b` → `__mod__(a, b`
    //           ^^^^               ^^
    this.overwrite(this.left.outerEnd, this.right.outerStart, ', ');

    this.right.patch();

    // `__mod__(a, b` → `__mod__(a, b)`
    //                               ^
    this.insert(this.right.outerEnd, ')');
  }

  /**
   * We always prefix with `__mod__` so no parens needed.
   */
  statementNeedsParens(): boolean {
    return false;
  }
}
