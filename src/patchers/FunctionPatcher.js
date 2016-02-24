import NodePatcher from './NodePatcher.js';
import type { Token, Node, ParseContext, Editor } from './types.js';

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
    this.insertAtEnd(')');
  }

  patchAsExpression({ method=false }={}) {
    let { parameters, node, context } = this;
    let tokens = context.tokensForNode(node);

    this.patchFunctionStart({ method }, tokens);
    parameters.forEach(parameter => parameter.patch());
    this.patchFunctionBody({ method });
  }

  patchFunctionStart({ method=false }, tokens) {
    let arrow = this.getArrowToken(tokens);

    if (!method) {
      this.insertAtStart('function');
    }

    if (!this.hasParamStart(tokens)) {
      this.insertAtStart('() ');
    }

    this.overwrite(arrow.range[0], arrow.range[1], '{');
  }

  patchFunctionBody() {
    if (this.body) {
      this.body.patch({ leftBrace: false });
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insertAtEnd('}');
    }
  }

  getArrowToken(tokens: Array<Token>): Token {
    let arrow = tokens[0];
    if (this.hasParamStart(tokens)) {
      arrow = this.context.tokenAtIndex(
        this.context.indexOfEndTokenForStartTokenAtIndex(this.startTokenIndex) + 1
      );
    }
    let expectedArrowType = this.expectedArrowType();
    if (arrow.type !== expectedArrowType) {
      throw this.error(
        `expected '${expectedArrowType}' but found ${arrow.type}`,
        ...arrow.range
      );
    }
    return arrow;
  }

  expectedArrowType(): string {
    return '->';
  }

  hasParamStart(tokens: Array<Token>): boolean {
    return tokens[0].type === 'PARAM_START';
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
