import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Node, ParseContext, Editor, SourceToken } from './../../../patchers/types.js';
import { FUNCTION, LPAREN, RPAREN } from 'coffee-lex';

export default class FunctionPatcher extends NodePatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, parameters: Array<NodePatcher>, body: ?NodePatcher) {
    super(node, context, editor);
    this.parameters = parameters;
    this.body = body;

    let { source } = context;
    while (source[this.after - '\n'.length] === '\n') {
      this.after -= '\n'.length;
    }
    while (source[this.end - '\n'.length] === '\n') {
      this.end -= '\n'.length;
    }
  }

  initialize() {
    if (this.body && !this.implicitReturnsDisabled()) {
      this.body.setImplicitlyReturns();
    }
    this.parameters.forEach(param => param.setRequiresExpression());
  }

  patchAsStatement(options={}) {
    this.insertAtStart('(');
    this.patchAsExpression(options);
    if (this.body && this.body.inline()) {
      this.insertAtEnd(')');
    } else {
      this.appendToEndOfLine(')');
    }
  }

  patchAsExpression({ method=false }={}) {
    this.patchFunctionStart({ method });
    this.parameters.forEach(parameter => parameter.patch());
    this.patchFunctionBody({ method });
  }

  patchFunctionStart({ method=false }) {
    let arrow = this.getArrowToken();

    if (!method) {
      this.insertAtStart('function');
    }

    if (!this.hasParamStart()) {
      this.insertAtStart('() ');
    }

    this.overwrite(arrow.start, arrow.end, '{');
  }

  patchFunctionBody() {
    if (this.body) {
      this.body.patch({ leftBrace: false });
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insertAtEnd('}');
    }
  }

  getArrowToken(): SourceToken {
    let arrowIndex = this.firstSourceTokenIndex;
    if (this.hasParamStart()) {
      let parenRange = this.getProgramSourceTokens()
        .rangeOfMatchingTokensContainingTokenIndex(
          LPAREN,
          RPAREN,
          this.firstSourceTokenIndex
        );
      let rparenIndex = parenRange[1].previous();
      arrowIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
        rparenIndex,
        FUNCTION
      );
      this.log({ rparenIndex, arrowIndex });
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
    return this.sourceTokenAtIndex(this.firstSourceTokenIndex).type === LPAREN;
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
}
