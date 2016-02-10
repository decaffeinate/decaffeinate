import NodePatcher from './NodePatcher';
import type { Node, ParseContext, Editor } from './types';

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
    if (this.body) {
      this.body.setImplicitlyReturns();
    }
  }

  patch({ method=false }={}) {
    let { parameters, body, node, context } = this;
    let tokens = context.tokensForNode(node);
    let isStatement = !this.willPatchAsExpression();

    if (isStatement) {
      this.insertAtStart('(');
    }

    this.patchFunctionStart({ method }, tokens);
    parameters.forEach(parameter => parameter.patch());
    if (body) {
      body.patch({ leftBrace: false });
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insertAtEnd('}');
    }

    if (isStatement) {
      this.insertAtEnd(')');
    }
  }

  patchFunctionStart({ method=false }, tokens) {
    let arrowIndex = 0;

    if (!method) {
      this.insertAtStart('function');
    }

    if (tokens[0].type !== 'PARAM_START') {
      this.insertAtStart('() ');
    } else {
      arrowIndex = this.context.indexOfEndTokenForStartTokenAtIndex(this.startTokenIndex) + 1;
    }

    let arrow = tokens[arrowIndex];
    this.overwrite(arrow.range[0], arrow.range[1], '{');
  }

  setExplicitlyReturns() {
    // Stop propagation of return info at functions.
  }
}
