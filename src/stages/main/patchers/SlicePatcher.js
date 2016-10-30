import NodePatcher from './../../../patchers/NodePatcher.js';
import type { SourceToken, Editor, Node, ParseContext } from './../../../patchers/types.js';
import { LBRACKET, RANGE, RBRACKET } from 'coffee-lex';

/**
 * Handles array or string slicing, e.g. `names[i..]`.
 */
export default class SlicePatcher extends NodePatcher {
  expression: NodePatcher;
  left: ?NodePatcher;
  right: ?NodePatcher;
  
  /**
   * `node` is of type `Slice`.
   */
  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher, left: ?NodePatcher, right: ?NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
    this.left = left;
    this.right = right;
  }

  initialize() {
    this.expression.setRequiresExpression();
    if (this.left) {
      this.left.setRequiresExpression();
    }
    if (this.right) {
      this.right.setRequiresExpression();
    }
  }

  /**
   * EXPRESSION '[' LEFT? ( .. | ... ) RIGHT? ']'
   */
  patchAsExpression() {
    this.expression.patch();
    let indexStart = this.getIndexStartSourceToken();
    // `a[0..1]` → `a.slice(0..1]`
    //   ^           ^^^^^^^
    this.overwrite(indexStart.start, indexStart.end, '.slice(');
    if (this.left) {
      this.left.patch();
    } else if (this.right) {
      // `a.slice(..1]` → `a.slice(0..1]`
      //                           ^
      this.insert(indexStart.end, '0');
    }
    let slice = this.getSliceSourceToken();
    let inclusive = slice.end - slice.start === '..'.length;
    let right = this.right;
    if (right) {
      // `a.slice(0..1]` → `a.slice(0, 1]`
      //           ^^                ^^
      this.overwrite(slice.start, slice.end, ', ');
      if (inclusive) {
        if (right.node.type === 'Int') {
          this.overwrite(
            right.contentStart,
            right.contentEnd,
            `${right.node.data + 1}`
          );
        } else {
          right.patch();
          this.insert(right.outerEnd, ' + 1');
        }
      } else {
        right.patch();
      }
    } else {
      // `a.slice(0..]` → `a.slice(0]`
      //           ^^
      this.overwrite(slice.start, slice.end, '');
    }
    let indexEnd = this.getIndexEndSourceToken();
    // `a.slice(0, 1]` → `a.slice(0, 1)`
    //              ^                 ^
    this.overwrite(indexEnd.start, indexEnd.end, ')');
  }

  /**
   * @private
   */
  getIndexStartSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.indexOfTokenMatchingPredicate(
      token => token.type === LBRACKET,
      this.expression.outerEndTokenIndex
    );
    if (!index || index.isAfter(this.contentEndTokenIndex)) {
      throw this.error(`could not find INDEX_START after slice expression`);
    }
    return tokens.tokenAtIndex(index);
  }

  /**
   * @private
   */
  getSliceSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let { source } = this.context;
    let index = tokens.indexOfTokenMatchingPredicate(token => {
      if (token.type !== RANGE) {
        return false;
      }
      let operator = source.slice(token.start, token.end);
      return operator === '...' || operator === '..';
    }, this.left ? this.left.outerEndTokenIndex : this.expression.outerEndTokenIndex);
    if (!index || index.isAfter(this.contentEndTokenIndex)) {
      throw this.error(`could not find '..' or '...' in slice`);
    }
    return tokens.tokenAtIndex(index);
  }

  /**
   * @private
   */
  getIndexEndSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.lastIndexOfTokenMatchingPredicate(
      token => token.type === RBRACKET,
      this.outerEndTokenIndex
    );
    if (!index || index.isBefore(this.contentStartTokenIndex)) {
      throw this.error(`could not find ']' ending slice`);
    }
    return tokens.tokenAtIndex(index);
  }

  /**
   * If `BASE` needs parens then `BASE[0..1]` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.expression.statementShouldAddParens();
  }
}
