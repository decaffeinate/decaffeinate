import UnaryOpPatcher from './UnaryOpPatcher.js';

/**
 * Handles unary exists, e.g. `a?`.
 */
export default class UnaryExistsOpPatcher extends UnaryOpPatcher {
  negated: boolean = false;

  /**
   * The expression version of this sometimes needs parentheses, but we don't
   * yet have a good mechanism for determining when that is, so we just make
   * sure they're always there. For example, this doesn't need parentheses:
   *
   *   set = a?
   *
   * Because it becomes this:
   *
   *   var set = typeof a !== 'undefined' && a !== null;
   *
   * But this does:
   *
   *   'set? ' + a?
   *
   * Because this:
   *
   *   'set? ' + a != null;
   *
   * Is equivalent to this:
   *
   *   ('set? + a) != null;
   *
   * Which has a different meaning than this:
   *
   *   'set? ' + (a != null);
   */
  patchAsExpression() {
    let needsParens = !this.isSurroundedByParentheses();
    if (needsParens) {
      // `a?` → `(a?`
      //         ^
      this.insert(this.contentStart, '(');
    }
    this.patchAsStatement();
    if (needsParens) {
      // `(a?` → `(a?)`
      //             ^
      this.insert(this.contentEnd, ')');
    }
  }

  /**
   * EXPRESSION '?'
   */
  patchAsStatement() {
    let { node, negated } = this;
    let nodeExpression = node.expression;
    let needsTypeofCheck = (
      nodeExpression &&
      nodeExpression.type === 'Identifier' &&
      !node.scope.hasBinding(nodeExpression.data)
    );

    if (needsTypeofCheck) {
      if (negated) {
        // `a?` → `typeof a === 'undefined' && a === null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(
          this.contentStart,
          this.contentEnd,
          `typeof ${nodeExpression.raw} === 'undefined' || ${nodeExpression.raw} === null`
        );
      } else {
        // `a?` → `typeof a !== 'undefined' && a !== null`
        //  ^^     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        this.overwrite(
          this.contentStart,
          this.contentEnd,
          `typeof ${nodeExpression.raw} !== 'undefined' && ${nodeExpression.raw} !== null`
        );
      }

    } else {
      if (negated) {
        // `a.b?` → `a.b == null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.outerEnd, this.contentEnd, ' == null');
      } else {
        // `a.b?` → `a.b != null`
        //     ^        ^^^^^^^^
        this.overwrite(this.expression.outerEnd, this.contentEnd, ' != null');
      }
    }
  }

  /**
   * Flips negated flag but doesn't edit anything immediately so that we can
   * use the correct operator in `patch`.
   */
  negate() {
    this.negated = !this.negated;
  }
}
