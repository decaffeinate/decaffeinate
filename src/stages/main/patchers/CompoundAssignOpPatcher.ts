import { SourceType } from 'coffee-lex';
import SourceToken from 'coffee-lex/dist/SourceToken';
import nodeContainsSoakOperation from '../../../utils/nodeContainsSoakOperation';
import notNull from '../../../utils/notNull';
import AssignOpPatcher from './AssignOpPatcher';

export default class CompoundAssignOpPatcher extends AssignOpPatcher {
  getOperatorToken(): SourceToken {
    let operatorIndex = this.indexOfSourceTokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      token => token.type === SourceType.OPERATOR
    );
    if (!operatorIndex) {
      throw this.error(
        `expected OPERATOR token between assignee and expression`,
        this.assignee.outerEnd,
        this.expression.outerStart
      );
    }
    return notNull(this.sourceTokenAtIndex(operatorIndex));
  }

  /**
   * If `LHS` needs parens then `LHS += RHS` needs parens.
   */
  statementNeedsParens(): boolean {
    return this.assignee.statementShouldAddParens();
  }

  /**
   * If the left-hand side of the assignment has a soak operation, then there
   * may be a __guard__ call surrounding the whole thing, so we can't patch
   * statement code, so instead run the expression code path.
   */
  lhsHasSoakOperation(): boolean {
    return nodeContainsSoakOperation(this.assignee.node);
  }
}
