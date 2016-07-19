import FunctionApplicationPatcher from './FunctionApplicationPatcher.js';
import findSoakContainer from '../../../utils/findSoakContainer.js';
import { CALL_START } from 'coffee-lex';

const GUARD_FUNC_HELPER =
  `function __guardFunc__(func, transform) {
  return typeof func === 'function' ? transform(func) : undefined;
}`;

export default class SoakedFunctionApplicationPatcher extends FunctionApplicationPatcher {
  patchAsExpression() {
    this.registerHelper('__guardFunc__', GUARD_FUNC_HELPER);
    let callStartToken = this.getCallStartToken();
    let soakContainer = findSoakContainer(this);
    let varName = soakContainer.claimFreeBinding('f');
    this.overwrite(this.fn.outerEnd, callStartToken.end, `, ${varName} => ${varName}(`);
    soakContainer.insert(soakContainer.contentStart, '__guardFunc__(');
    soakContainer.insert(soakContainer.contentEnd, ')');

    super.patchAsExpression();
  }

  getCallStartToken(): SourceToken {
    let tokens = this.context.sourceTokens;
    let index = tokens.indexOfTokenMatchingPredicate(
      token => token.type === CALL_START,
      this.fn.outerEndTokenIndex
    );
    if (!index || index.isAfter(this.contentEndTokenIndex)) {
      throw this.error(`unable to find open-paren for function call`);
    }
    return tokens.tokenAtIndex(index);
  }
}
