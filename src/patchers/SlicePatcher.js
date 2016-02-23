import NodePatcher from './NodePatcher';
import type { Token, Editor, Node, ParseContext } from './types';

/**
 * Handles array or string slicing, e.g. `names[i..]`.
 */
export default class SlicePatcher extends NodePatcher {
  /**
   * `node` is of type `Slice`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher, left: ?NodePatcher, right: ?NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this.left = left;
    this.right = right;
  }

  /**
   * EXPRESSION '[' LEFT? ( .. | ... ) RIGHT? ']'
   */
  patchAsExpression() {
    let indexStart = this.getIndexStartToken();
    // `a[0..1]` → `a.slice(0..1]`
    //   ^           ^^^^^^^
    this.overwrite(...indexStart.range, '.slice(');
    if (this.left) {
      this.left.patch();
    } else if (this.right) {
      // `a.slice(..1]` → `a.slice(0..1]`
      //                           ^
      this.insert(indexStart.range[1], '0');
    }
    let slice = this.getSliceToken();
    let inclusive = slice.data === '..';
    let right = this.right;
    if (right) {
      // `a.slice(0..1]` → `a.slice(0, 1]`
      //           ^^                ^^
      this.overwrite(...slice.range, ', ');
      if (inclusive) {
        if (right.node.type === 'Int') {
          this.overwrite(
            right.start,
            right.end,
            `${right.node.data + 1}`
          );
        } else {
          right.patch();
          this.insert(right.after, ' + 1');
        }
      } else {
        right.patch();
      }
    } else {
      // `a.slice(0..]` → `a.slice(0]`
      //           ^^
      this.overwrite(...slice.range, '');
    }
    let indexEnd = this.getIndexEndToken();
    // `a.slice(0, 1]` → `a.slice(0, 1)`
    //              ^                 ^
    this.overwrite(...indexEnd.range, ')');
  }

  patchAsStatement() {
    this.patchAsExpression();
  }

  /**
   * @private
   */
  getIndexStartToken(): Token {
    let index = this.expression.afterTokenIndex;
    let token;
    do {
      token = this.context.tokenAtIndex(index);
      index += 1;
    } while (token && token.type !== 'INDEX_START');
    if (!token || index > this.afterTokenIndex) {
      throw this.error(`could not find INDEX_START after slice expression`);
    }
    return token;
  }

  /**
   * @private
   */
  getSliceToken(): Token {
    let index = this.left ? this.left.afterTokenIndex : this.expression.afterTokenIndex;
    let token;
    do {
      token = this.context.tokenAtIndex(index);
      index += 1;
    } while (token && token.type !== '...' && token.type !== '..');
    if (!token || index > this.afterTokenIndex) {
      throw this.error(`could not find '..' or '...' in slice`);
    }
    return token;
  }

  /**
   * @private
   */
  getIndexEndToken(): Token {
    let index = this.afterTokenIndex;
    let token;
    do {
      token = this.context.tokenAtIndex(index);
      index -= 1;
    } while (token && token.type !== ']');
    if (!token || index < this.beforeTokenIndex) {
      throw this.error(`could not find ']' ending slice`);
    }
    return token;
  }
}
