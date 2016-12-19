import NodePatcher from './../../../patchers/NodePatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import type BlockPatcher from './BlockPatcher';
import type { PatcherContext, SourceToken } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: ?BlockPatcher;

  constructor(patcherContext: PatcherContext, parameters: Array<NodePatcher>, body: ?NodePatcher) {
    super(patcherContext);
    this.parameters = parameters;
    this.body = body;
  }

  initialize() {
    if (this.body && !this.implicitReturnsDisabled()) {
      this.body.setImplicitlyReturns();
    }
    this.parameters.forEach(param => param.setRequiresExpression());
  }

  patchAsStatement(options={}) {
    this.insert(this.innerStart, '(');
    this.patchAsExpression(options);
    this.insert(this.innerEnd, ')');
  }

  patchAsExpression({ method=false }={}) {
    this.patchFunctionStart({ method });
    this.parameters.forEach((parameter, i) => {
      let isLast = i === this.parameters.length - 1;
      let needsComma = !isLast && !parameter.hasSourceTokenAfter(SourceType.COMMA);
      parameter.patch();
      if (needsComma) {
        this.insert(parameter.outerEnd, ',');
      }
    });
    this.patchFunctionBody({ method });
  }

  patchFunctionStart({ method=false }) {
    let arrow = this.getArrowToken();

    if (!method) {
      this.insert(this.contentStart, 'function');
    }

    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }

  patchFunctionBody() {
    if (this.body) {
      if (this.isSurroundedByParentheses()) {
        this.body.patch({ leftBrace: false, rightBrace: false });
        this.insert(this.innerEnd, this.body.inline() ? ' }' : '}');
      } else if (this.parent instanceof FunctionApplicationPatcher &&
          this.parent.args[this.parent.args.length - 1] === this) {
        // If we're the last argument to a function, place the } just before the
        // close-paren. There will always be a close-paren because all implicit
        // parentheses were added in the normalize stage.
        this.body.patch({ leftBrace: false, rightBrace: false });
        let closeParenIndex = this.parent.indexOfSourceTokenBetweenSourceIndicesMatching(
          this.contentEnd, this.parent.contentEnd, token => token.type === SourceType.CALL_END
        );
        let closeParen = this.sourceTokenAtIndex(closeParenIndex);
        this.insert(closeParen.start, this.body.inline() ? ' }' : '}');
      } else {
        this.body.patch({ leftBrace: false });
      }
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insert(this.innerEnd, '}');
    }
  }

  getArrowToken(): SourceToken {
    let arrowIndex = this.contentStartTokenIndex;
    if (this.hasParamStart()) {
      let parenRange = this.getProgramSourceTokens()
        .rangeOfMatchingTokensContainingTokenIndex(
          SourceType.LPAREN,
          SourceType.RPAREN,
          this.contentStartTokenIndex
        );
      let rparenIndex = parenRange[1].previous();
      arrowIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        rparenIndex,
        SourceType.FUNCTION
      );
    }
    let arrow = this.sourceTokenAtIndex(arrowIndex);
    let expectedArrowType = this.expectedArrowType();
    let actualArrowType = this.sourceOfToken(arrow);
    if (actualArrowType !== expectedArrowType) {
      throw this.error(
        `expected '${expectedArrowType}' but found ${actualArrowType}`,
        arrow.start, arrow.end
      );
    }
    return arrow;
  }

  expectedArrowType(): string {
    return '->';
  }

  hasParamStart(): boolean {
    return this.sourceTokenAtIndex(this.contentStartTokenIndex).type === SourceType.LPAREN;
  }

  canHandleImplicitReturn(): boolean {
    return true;
  }

  setExplicitlyReturns() {
    // Stop propagation of return info at functions.
  }

  /**
   * Call before initialization to prevent this function from implicitly
   * returning its last statement.
   */
  disableImplicitReturns() {
    this._implicitReturnsDisabled = true;
  }

  /**
   * Determines whether this function has implicit returns disabled.
   */
  implicitReturnsDisabled(): boolean {
    return this._implicitReturnsDisabled;
  }

  /**
   * Functions in CoffeeScript are always anonymous and therefore need parens.
   */
  statementNeedsParens(): boolean {
    return true;
  }
}
