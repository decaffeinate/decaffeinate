import NodePatcher from './NodePatcher';

export default class FunctionPatcher extends NodePatcher {
  constructor(node, context, editor, parameters, body) {
    super(node, context, editor);
    this.parameters = parameters;
    this.body = body;
  }

  patch() {
    let { parameters, body, node, context } = this;
    let tokens = context.tokensForNode(node);
    let isStatement = this.isStatement();

    if (isStatement) {
      this.insertAtStart('(');
    }

    this.patchFunctionStart(tokens);
    parameters.forEach(parameter => parameter.patch());
    if (body) {
      body.patch({ function: true });
    }
    this.patchFunctionEnd(tokens);

    if (isStatement) {
      this.insertAtEnd(')');
    }
  }

  patchFunctionStart(tokens) {
    let arrowIndex = 0;

    this.insertAtStart('function');

    if (tokens[0].type !== 'PARAM_START') {
      this.insertAtStart('() ');
    } else {
      arrowIndex = findParamEnd(tokens, 0) + 1;
    }

    let arrow = tokens[arrowIndex];
    this.overwrite(arrow.range[0], arrow.range[1], '{');
  }

  patchFunctionEnd() {
    this.insertAtEnd(' }');
  }

  setReturns() {
    // Stop propagation of return info at functions.
  }
}

function findParamEnd(tokens, paramStartIndex) {
  let level = 0;

  for (let i = paramStartIndex; i < tokens.length; i++) {
    switch (tokens[i].type) {
      case 'PARAM_START':
        level++;
        break;

      case 'PARAM_END':
        level--;
        break;
    }

    if (level === 0) {
      return i;
    }
  }

  throw new Error('no PARAM_END token found to match PARAM_START');
}
