import NodePatcher from './../../../patchers/NodePatcher';
import type { SourceToken, PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

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
  constructor(patcherContext: PatcherContext, expression: NodePatcher, left: ?NodePatcher, right: ?NodePatcher) {
    super(patcherContext);
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
    let right = this.right;
    if (right) {
      if (this.isInclusive()) {
        if (right.node.raw === '-1') {
          this.remove(
            slice.start,
            right.outerEnd
          );
        } else if (right.node.type === 'Int') {
          this.overwrite(
            slice.start,
            right.outerEnd,
            `, ${right.node.data + 1}`
          );
        } else {
          // `a.slice(0..1]` → `a.slice(0, 1]`
          //           ^^                ^^
          this.overwrite(slice.start, slice.end, ', ');
          right.patch();
          this.insert(right.outerEnd, ' + 1 || undefined');
        }
      } else {
        // `a.slice(0..1]` → `a.slice(0, 1]`
        //           ^^                ^^
        this.overwrite(slice.start, slice.end, ', ');
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

  getInitialSpliceCode(): string {
    return this.captureCodeForPatchOperation(() => this.patchAsSpliceExpressionStart());
  }

  /**
   * Patch into the first part of a splice expression. For example,
   *
   * a[b...c]
   *
   * becomes
   *
   * a.splice(b, c - b
   *
   * The enclosing assignment operator patcher will do the rest.
   */
  patchAsSpliceExpressionStart() {
    this.expression.patch();
    let indexStart = this.getIndexStartSourceToken();
    // `a[b..c]` → `a.splice(b..c]`
    //   ^           ^^^^^^^^
    this.overwrite(indexStart.start, indexStart.end, '.splice(');
    let leftCode;
    if (this.left) {
      leftCode = this.left.patchRepeatable();
    } else {
      // `a.splice(..c]` → `a.splice(0..c]`
      //                             ^
      this.insert(indexStart.end, '0');
      leftCode = '0';
    }
    let slice = this.getSliceSourceToken();
    let right = this.right;
    if (right) {
      // `a.splice(b..c]` → `a.splice(b, c]`
      //                               ^^
      this.overwrite(slice.start, slice.end, ', ');
      right.patch();
      if (leftCode !== '0') {
        // `a.splice(b, c]` → `a.splice(b, c - b]`
        //                                  ^^^^
        this.insert(right.outerEnd, ` - ${leftCode}`);
      }
      if (this.isInclusive()) {
        // `a.splice(b, c - b]` → `a.splice(b, c - b + 1]`
        //                                          ^^^^
        this.insert(right.outerEnd, ' + 1');
      }
    } else {
      // `a.splice(b..]` → `a.splice(b, 9e9]`
      //            ^^                ^^^^^
      this.overwrite(slice.start, slice.end, ', 9e9');
    }
    let indexEnd = this.getIndexEndSourceToken();
    // `a.splice(b, c - b + 1]` → `a.splice(b, c - b + 1`
    //                       ^
    this.remove(indexEnd.start, indexEnd.end);
  }

  /**
   * @private
   */
  isInclusive() {
    let slice = this.getSliceSourceToken();
    return slice.end - slice.start === '..'.length;
  }

  /**
   * @private
   */
  getIndexStartSourceToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.indexOfTokenMatchingPredicate(
      token => token.type === SourceType.LBRACKET,
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
      if (token.type !== SourceType.RANGE) {
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
      token => token.type === SourceType.RBRACKET,
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
