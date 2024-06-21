import { SourceType, SourceToken } from 'coffee-lex';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import NodePatcher from './../../../patchers/NodePatcher';
import BlockPatcher from './BlockPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';

export default class FunctionPatcher extends NodePatcher {
  parameters: Array<NodePatcher>;
  body: BlockPatcher | null;
  _implicitReturnsDisabled = false;

  constructor(patcherContext: PatcherContext, parameters: Array<NodePatcher>, body: BlockPatcher | null) {
    super(patcherContext);
    this.parameters = parameters;
    this.body = body;
  }

  initialize(): void {
    if (this.body && !this.implicitReturnsDisabled()) {
      this.body.setImplicitlyReturns();
    }
    this.parameters.forEach((param) => {
      param.setAssignee();
      param.setRequiresExpression();
    });
  }

  patchAsExpression({ method = false }: PatchOptions = {}): void {
    this.patchFunctionStart({ method });
    this.parameters.forEach((parameter, i) => {
      const isLast = i === this.parameters.length - 1;
      const needsComma = !isLast && !parameter.hasSourceTokenAfter(SourceType.COMMA);
      parameter.patch();
      if (needsComma) {
        this.insert(parameter.outerEnd, ',');
      }
    });
    this.patchFunctionBody();
  }

  patchFunctionStart({ method = false }: { method: boolean }): void {
    const arrow = this.getArrowToken();

    if (!method) {
      this.insert(this.contentStart, 'function');
    }

    if (!this.hasParamStart()) {
      this.insert(this.contentStart, '() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }

  patchFunctionBody(): void {
    if (this.body) {
      if (this.isSurroundedByParentheses()) {
        this.body.patch({ leftBrace: false, rightBrace: false });
        this.insert(this.innerEnd, this.body.inline() ? ' }' : '}');
      } else if (this.isEndOfFunctionCall()) {
        this.body.patch({ leftBrace: false, rightBrace: false });
        this.placeCloseBraceBeforeFunctionCallEnd();
      } else {
        this.body.patch({ leftBrace: false });
      }
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insert(this.innerEnd, '}');
    }
  }

  isEndOfFunctionCall(): boolean {
    return this.parent instanceof FunctionApplicationPatcher && this.parent.args[this.parent.args.length - 1] === this;
  }

  /**
   * If we're the last argument to a function, place the } just before the
   * close-paren. There will always be a close-paren because all implicit
   * parentheses were added in the normalize stage.
   *
   * However, if the close-paren is at the end of our line, it usually looks
   * better to put the }) on the next line instead.
   */
  placeCloseBraceBeforeFunctionCallEnd(): void {
    if (!this.body) {
      throw this.error('Expected non-null body.');
    }
    const closeParenIndex = notNull(this.parent).indexOfSourceTokenBetweenSourceIndicesMatching(
      this.contentEnd,
      notNull(this.parent).contentEnd,
      (token) => token.type === SourceType.CALL_END || token.type === SourceType.RPAREN,
    );
    if (!closeParenIndex) {
      throw this.error('Expected to find close paren index after function call.');
    }
    const closeParen = this.sourceTokenAtIndex(closeParenIndex);
    if (!closeParen) {
      throw this.error('Expected to find close paren after function call.');
    }
    const shouldMoveCloseParen = !this.body.inline() && !this.slice(this.contentEnd, closeParen.start).includes('\n');
    if (shouldMoveCloseParen) {
      this.appendLineAfter('}', -1);
    } else {
      this.insert(closeParen.start, this.body.inline() ? ' }' : '}');
    }
  }

  getArrowToken(): SourceToken {
    let arrowIndex = this.contentStartTokenIndex;
    if (this.hasParamStart()) {
      const parenRange = this.getProgramSourceTokens().rangeOfMatchingTokensContainingTokenIndex(
        SourceType.LPAREN,
        SourceType.RPAREN,
        this.contentStartTokenIndex,
      );
      if (!parenRange) {
        throw this.error('Expected to find function paren range in function.');
      }
      const rparenIndex = parenRange[1].previous();
      if (!rparenIndex) {
        throw this.error('Expected to find rparen index in function.');
      }
      arrowIndex = notNull(this.indexOfSourceTokenAfterSourceTokenIndex(rparenIndex, SourceType.FUNCTION));
    }
    const arrow = this.sourceTokenAtIndex(arrowIndex);
    if (!arrow) {
      throw this.error('Expected to find arrow token in function.');
    }
    const expectedArrowType = this.expectedArrowType();
    const actualArrowType = this.sourceOfToken(arrow);
    if (actualArrowType !== expectedArrowType) {
      throw this.error(`expected '${expectedArrowType}' but found ${actualArrowType}`, arrow.start, arrow.end);
    }
    return arrow;
  }

  expectedArrowType(): string {
    return '->';
  }

  hasParamStart(): boolean {
    return notNull(this.sourceTokenAtIndex(this.contentStartTokenIndex)).type === SourceType.LPAREN;
  }

  canHandleImplicitReturn(): boolean {
    return true;
  }

  setExplicitlyReturns(): void {
    // Stop propagation of return info at functions.
  }

  /**
   * Call before initialization to prevent this function from implicitly
   * returning its last statement.
   */
  disableImplicitReturns(): void {
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
