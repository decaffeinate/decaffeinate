import BlockPatcher from './BlockPatcher';
import NodePatcher from '../../../patchers/NodePatcher';
import type { PatcherContext, SourceToken } from '../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class SwitchCasePatcher extends NodePatcher {
  conditions: Array<NodePatcher>;
  consequent: ?NodePatcher;

  negated: boolean;

  constructor(patcherContext: PatcherContext, conditions: Array<NodePatcher>, consequent: NodePatcher) {
    super(patcherContext);
    this.conditions = conditions;
    this.consequent = consequent;
    this.negated = false;
  }

  initialize() {
    this.conditions.forEach(condition => condition.setRequiresExpression());
  }

  patchAsStatement() {
    // `when a, b, c then d` → `a, b, c then d`
    //  ^^^^^
    let whenToken = this.getWhenToken();
    this.remove(whenToken.start, this.conditions[0].contentStart);

    // `a, b, c then d` → `a b c then d`
    //   ^  ^
    this.getCommaTokens().forEach(comma => {
      this.remove(comma.start, comma.end);
    });

    this.conditions.forEach(condition => {
      // `a b c then d` → `case a: case b: case c: then d`
      //                   ^^^^^ ^^^^^^^ ^^^^^^^ ^
      this.insert(condition.outerStart, 'case ');
      if (this.negated) {
        condition.negate();
      }
      condition.patch({ leftBrace: false, rightBrace: false });
      this.insert(condition.outerEnd, ':');
    });


    // `case a: case b: case c: then d → `case a: case b: case c: d`
    //                          ^^^^^
    let thenToken = this.getThenToken();
    if (thenToken) {
      if (this.consequent !== null) {
        this.remove(thenToken.start, this.consequent.contentStart);
      } else {
        this.remove(thenToken.start, thenToken.end);
      }
    }

    if (this.consequent !== null) {
      this.consequent.patch({ leftBrace: false, rightBrace: false });
    }

    let implicitReturnWillBreak = (
      this.implicitlyReturns() &&
      this.implicitReturnPatcher().implicitReturnWillBreak() &&
      (!this.consequent || this.consequent.allCodePathsPresent())
    );
    let shouldAddBreak = !this.hasExistingBreak() && !implicitReturnWillBreak;
    if (shouldAddBreak) {
      if (thenToken) {
        // `case a: case b: case c: then d → `case a: case b: case c: d break`
        //                                                             ^^^^^^
        if (this.consequent !== null) {
          this.insert(this.consequent.contentEnd, ' break');
        } else {
          this.insert(thenToken.end, ' break');
        }
      } else {
        this.appendLineAfter('break', 1);
      }
    }
  }

  setImplicitlyReturns() {
    super.setImplicitlyReturns();
    if (this.consequent !== null) {
      this.consequent.setImplicitlyReturns();
    }
  }

  patchAsExpression() {
    this.patchAsStatement();
  }

  /**
   * Don't actually negate the conditions until just before patching, since
   * otherwise we might accidentally overwrite a ! character that gets inserted.
   */
  negate() {
    this.negated = !this.negated;
  }

  /**
   * @private
   */
  getWhenToken(): SourceToken {
    let whenToken = this.sourceTokenAtIndex(this.contentStartTokenIndex);
    if (!whenToken) {
      throw this.error(`bad token index for start of 'when'`);
    }
    if (whenToken.type !== SourceType.WHEN) {
      throw this.error(`unexpected ${SourceType[whenToken.type]} at start of 'switch' case`);
    }
    return whenToken;
  }

  /**
   * @private
   */
  getCommaTokens(): Array<SourceToken> {
    let result = [];
    for (let i = 1; i < this.conditions.length; i++) {
      let left = this.conditions[i - 1];
      let right = this.conditions[i];
      let commaIndex = this.indexOfSourceTokenBetweenPatchersMatching(
        left, right, token => token.type === SourceType.COMMA
      );
      if (!commaIndex) {
        throw this.error(
          `unable to find comma between 'when' conditions`,
          left.contentEnd,
          right.contentStart
        );
      }
      result.push(this.sourceTokenAtIndex(commaIndex));
    }
    return result;
  }

  /**
   * @private
   */
  hasExistingBreak(): boolean {
    if (!(this.consequent instanceof BlockPatcher)) {
      return false;
    }
    let lastStatement = this.consequent.statements[this.consequent.statements.length - 1];
    return lastStatement &&
        lastStatement.node.type === 'Identifier' &&
        lastStatement.node.data === 'break';
  }

  /**
   * Gets the token representing the `then` between condition and consequent.
   *
   * @private
   */
  getThenToken(): ?SourceToken {
    let thenTokenIndex = this.indexOfSourceTokenBetweenSourceIndicesMatching(
      this.conditions[0].outerEnd,
      this.consequent !== null ? this.consequent.outerStart : this.contentEnd,
      token => token.type === SourceType.THEN
    );
    return thenTokenIndex ? this.sourceTokenAtIndex(thenTokenIndex) : null;
  }
}
