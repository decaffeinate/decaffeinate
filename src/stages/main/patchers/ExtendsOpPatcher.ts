import { SourceType } from 'coffee-lex';

import SourceToken from 'coffee-lex/dist/SourceToken';
import BinaryOpPatcher from './BinaryOpPatcher';

const EXTENDS_HELPER = `
function __extends__(child, parent) {
  Object.getOwnPropertyNames(parent).forEach(
    name => child[name] = parent[name]
  );
  child.prototype = Object.create(parent.prototype);
  child.__super__ = parent.prototype;
  return child;
}
`;

/**
 * Handles `extends` infix operator.
 */
export default class ExtendsOpPatcher extends BinaryOpPatcher {
  /**
   * CHILD extends PARENT
   */
  patchAsExpression(): void {
    let helper = this.registerHelper('__extends__', EXTENDS_HELPER);
    this.insert(this.left.outerStart, `${helper}(`);
    this.left.patch();
    this.overwrite(this.left.outerEnd, this.right.outerStart, ', ');
    this.right.patch();
    this.insert(this.right.outerEnd, ')');
  }

  /**
   * We always prefix with `__extends__`, so no need for parens.
   */
  statementNeedsParens(): boolean {
    return false;
  }

  operatorTokenPredicate(): (token: SourceToken) => boolean {
    // Right now the "extends" token is an identifier rather than a binary
    // operator, so treat it as a special case for this node type.
    return (token: SourceToken) =>
      token.type === SourceType.IDENTIFIER &&
        this.sourceOfToken(token) === 'extends';
  }
}
