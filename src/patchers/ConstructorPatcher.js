import IdentifierPatcher from './IdentifierPatcher';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher';
import type FunctionPatcher from './FunctionPatcher';
import type { Editor, Node, ParseContext, Token } from './types';

export default class ConstructorPatcher extends ObjectBodyMemberPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: FunctionPatcher) {
    let constructorToken = context.tokensForNode(node)[0];
    let virtualKey = new IdentifierPatcher(
      buildVirtualConstructorIdentifierNode(constructorToken),
      context,
      editor
    );
    super(node, context, editor, virtualKey, expression);

    // Constructor methods do not have implicit returns.
    expression.disableImplicitReturns();
  }

  /**
   * Don't put semicolons after class constructors.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }
}

function buildVirtualConstructorIdentifierNode(constructorToken: Token): Node {
  return {
    type: 'Identifier',
    line: constructorToken.line,
    column: constructorToken.column,
    raw: constructorToken.raw,
    range: constructorToken.range
  };
}
