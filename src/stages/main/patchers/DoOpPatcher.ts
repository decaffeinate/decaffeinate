import { SourceType } from 'coffee-lex';
import SourceTokenListIndex from 'coffee-lex/dist/SourceTokenListIndex';
import NodePatcher from '../../../patchers/NodePatcher';
import { PatcherContext } from '../../../patchers/types';
import notNull from '../../../utils/notNull';
import AssignOpPatcher from './AssignOpPatcher';
import DefaultParamPatcher from './DefaultParamPatcher';
import FunctionPatcher from './FunctionPatcher';
import IdentifierPatcher from './IdentifierPatcher';

export default class DoOpPatcher extends NodePatcher {
  expression: NodePatcher;

  constructor(patcherContext: PatcherContext, expression: NodePatcher) {
    super(patcherContext);
    this.expression = expression;
  }

  initialize(): void {
    this.expression.setRequiresExpression();
  }

  patchAsExpression(): void {
    let doTokenIndex = this.getDoTokenIndex();
    let doToken = notNull(this.sourceTokenAtIndex(doTokenIndex));
    let nextToken = notNull(this.sourceTokenAtIndex(notNull(doTokenIndex.next())));
    this.remove(doToken.start, nextToken.start);

    let addParens = !this.isSurroundedByParentheses() && !(
        this.expression instanceof IdentifierPatcher
      );

    if (addParens) {
      this.insert(this.outerStart, '(');
    }

    this.expression.patch();

    if (addParens) {
      this.insert(this.outerEnd, ')');
    }

    let args: Array<string> = [];
    if (this.hasDoFunction()) {
      let func = this.getDoFunction();
      func.parameters.forEach(param => {
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
   * Determine whether there is a "do function"--that is, a function where we
   * should change default params to arguments to the do call.
   */
  hasDoFunction(): boolean {
    return this.expression instanceof FunctionPatcher ||
      (this.expression instanceof AssignOpPatcher &&
        this.expression.expression instanceof FunctionPatcher);
  }

  getDoFunction(): FunctionPatcher {
    if (this.expression instanceof FunctionPatcher) {
      return this.expression;
    } else if (this.expression instanceof AssignOpPatcher &&
        this.expression.expression instanceof FunctionPatcher) {
      return this.expression.expression;
    } else {
      throw this.error('Should only call getDoFunction if hasDoFunction is true.');
    }
  }

  /**
   * @private
   */
  getDoTokenIndex(): SourceTokenListIndex {
    let index = this.contentStartTokenIndex;
    let token = this.sourceTokenAtIndex(index);
    if (!token || token.type !== SourceType.DO) {
      throw this.error(`expected 'do' at start of expression`);
    }
    return index;
  }
}
