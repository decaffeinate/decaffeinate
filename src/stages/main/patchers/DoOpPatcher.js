import DefaultParamPatcher from './DefaultParamPatcher.js';
import FunctionPatcher from './FunctionPatcher.js';
import NodePatcher from '../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext, SourceTokenListIndex } from '../../../patchers/types.js';
import { DO } from 'coffee-lex';

export default class DoOpPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(node: Node, context: ParseContext, editor: Editor, expression: NodePatcher) {
    super(node, context, editor);
    this.expression = expression;
  }

  initialize() {
    this.expression.setRequiresExpression();
  }
  
  patchAsExpression() {
    let doTokenIndex = this.getDoTokenIndex();
    let doToken = this.sourceTokenAtIndex(doTokenIndex);
    let nextToken = this.sourceTokenAtIndex(doTokenIndex.next());
    this.remove(doToken.start, nextToken.start);

    let addParens = (
      this.expression instanceof FunctionPatcher &&
      !this.isSurroundedByParentheses()
    );

    if (addParens) {
      this.insert(this.outerStart, '(');
    }

    this.expression.patch();

    if (addParens) {
      this.insert(this.outerEnd, ')');
    }

    let args = [];
    if (this.expression instanceof FunctionPatcher) {
      let expression = (this.expression: FunctionPatcher);
      expression.parameters.forEach(param => {
        if (param instanceof DefaultParamPatcher) {
          let valueSource = param.value.getPatchedSource();
          this.remove(param.param.outerEnd, param.value.outerEnd);
          args.push(valueSource);
        } else {
          args.push(param.getPatchedSource());
        }
      });
    }
    this.insert(this.innerEnd, `(${args.join(', ')})`);
  }

  /**
   * @private
   */
  getDoTokenIndex(): SourceTokenListIndex {
    let index = this.contentStartTokenIndex;
    let token = this.sourceTokenAtIndex(index);
    if (!token || token.type !== DO) {
      throw this.error(`expected 'do' at start of expression`);
    }
    return index;
  }
}
