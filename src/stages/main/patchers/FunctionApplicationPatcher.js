import NodePatcher from './../../../patchers/NodePatcher.js';
import type { Editor, Node, ParseContext } from './../../../patchers/types.js';
import { COMMA } from 'coffee-lex';
import { isSemanticToken } from '../../../utils/types.js';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

  constructor(node: Node, context: ParseContext, editor: Editor, fn: NodePatcher, args: Array<NodePatcher>) {
    super(node, context, editor);
    this.fn = fn;
    this.args = args;
  }

  initialize() {
    this.fn.setRequiresExpression();
    this.args.forEach(arg => arg.setRequiresExpression());
  }

  /**
   * Note that we don't need to worry about implicit function applications,
   * since the normalize stage would have already added parens.
   */
  patchAsExpression() {
    let { args, outerEndTokenIndex } = this;

    this.fn.patch();

    args.forEach((arg, i) => {
      arg.patch();
      let isLast = i === args.length - 1;
      let commaTokenIndex = arg.node.virtual ? null : this.indexOfSourceTokenAfterSourceTokenIndex(
        arg.outerEndTokenIndex,
        COMMA,
        isSemanticToken
      );
      // Ignore commas after the end of the function call.
      if (commaTokenIndex && commaTokenIndex.compare(outerEndTokenIndex) <= 0) {
        commaTokenIndex = null;
      }
      let commaToken = commaTokenIndex && this.sourceTokenAtIndex(commaTokenIndex);
      if (isLast && commaToken) {
        this.remove(arg.outerEnd, commaToken.end);
      } else if (!isLast && !commaToken) {
        this.insert(arg.outerEnd, ',');
      }
    });
  }

  /**
   * Probably can't happen, but just for completeness.
   */
  statementNeedsParens(): boolean {
    return this.fn.statementShouldAddParens();
  }
}
