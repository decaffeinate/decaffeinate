import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import registerModHelper from '../../../utils/registerModHelper';
import BinaryOpPatcher from './BinaryOpPatcher';

export default class ModuloOpPatcher extends BinaryOpPatcher {
  /**
   * `node` is of type `ModuloOp`.
   */
  constructor(patcherContext: PatcherContext, left: NodePatcher, right: NodePatcher) {
    super(patcherContext, left, right);
  }

  patchAsExpression(): void {
    let helper = registerModHelper(this);

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
