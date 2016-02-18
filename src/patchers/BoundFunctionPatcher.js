import BlockPatcher from './BlockPatcher';
import FunctionPatcher from './FunctionPatcher';
import type { Token } from './types';

/**
 * Handles bound functions, i.e. "fat arrows".
 */
export default class BoundFunctionPatcher extends FunctionPatcher {
  initialize() {
    super.initialize();
    if (this.hasInlineBody()) {
      this.body.setExpression();
    }
  }

  // There's no difference between statement and expression arrow functions.
  patchAsStatement(options={}) {
    this.patchAsExpression(options);
  }

  patchFunctionStart(options, tokens: Array<Token>) {
    let arrow = this.getArrowToken(tokens);

    if (!this.hasParamStart(tokens)) {
      this.insertAtStart('() ');
    } else if (this.parameters.length === 1) {
      let [ param ] = this.parameters;
      if (param.isSurroundedByParentheses()) {
        this.remove(param.before, param.start);
        this.remove(param.end, param.after);
      }
    }

    if (!this.willPatchBodyInline()) {
      this.insert(arrow.range[1], ' {');
    }
  }

  patchFunctionBody() {
    if (this.body) {
      if (!this.willPatchBodyInline()) {
        this.body.patch({ leftBrace: false });
      } else {
        this.body.patch();
      }
    } else {
      // No body, so BlockPatcher can't insert it for us.
      this.insertAtEnd('}');
    }
  }

  expectedArrowType(): string {
    return '=>';
  }

  willPatchBodyInline(): boolean {
    let body = this.getBody();
    return body ? body.willPatchAsExpression() : false;
  }

  hasInlineBody(): boolean {
    let body = this.getBody();
    return body ? body.inline() : false;
  }

  getBody(): ?BlockPatcher {
    if (!this.body) {
      return null;
    }

    return (this.body: BlockPatcher);
  }
}
