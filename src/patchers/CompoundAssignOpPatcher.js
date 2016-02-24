import AssignOpPatcher from './AssignOpPatcher.js';
import type { Token } from './types.js';

export default class CompoundAssignOpPatcher extends AssignOpPatcher {
  getOperatorToken(): Token {
    let operator = this.tokenBetweenPatchersMatching(
      this.assignee,
      this.expression,
      'COMPOUND_ASSIGN'
    );
    if (!operator) {
      throw this.error(
        `expected COMPOUND_ASSIGN token between assignee and expression`
      );
    }
    return operator;
  }
}
