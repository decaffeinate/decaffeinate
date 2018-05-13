import { SourceType } from 'coffee-lex';
import { PatcherContext, PatchOptions } from '../../../patchers/types';
import { isSemanticToken } from '../../../utils/types';
import NodePatcher from './../../../patchers/NodePatcher';

export default class FunctionApplicationPatcher extends NodePatcher {
  fn: NodePatcher;
  args: Array<NodePatcher>;

  constructor(patcherContext: PatcherContext, fn: NodePatcher, args: Array<NodePatcher>) {
    super(patcherContext);
    this.fn = fn;
    this.args = args;
  }

  initialize(): void {
    this.fn.setRequiresExpression();
    this.args.forEach(arg => arg.setRequiresExpression());
  }

  /**
   * Note that we don't need to worry about implicit function applications,
   * since the normalize stage would have already added parens.
   */
  patchAsExpression({ fnNeedsParens = false }: PatchOptions = {}): void {
    let { args, outerEndTokenIndex } = this;

    if (fnNeedsParens) {
      this.insert(this.fn.outerStart, '(');
    }
    this.fn.patch({ skipParens: fnNeedsParens });
    if (fnNeedsParens) {
      this.insert(this.fn.outerEnd, ')');
    }

    args.forEach((arg, i) => {
      arg.patch();
      let isLast = i === args.length - 1;
      let commaTokenIndex = this.indexOfSourceTokenAfterSourceTokenIndex(
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
