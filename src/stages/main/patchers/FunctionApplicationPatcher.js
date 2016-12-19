import NodePatcher from './../../../patchers/NodePatcher';
import type { PatcherContext } from './../../../patchers/types';
import { SourceType } from 'coffee-lex';
import { isSemanticToken } from '../../../utils/types';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, fn: NodePatcher, args: Array<NodePatcher>) {
    super(patcherContext);
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
        SourceType.COMMA,
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
