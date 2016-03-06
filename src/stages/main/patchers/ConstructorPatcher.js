import IdentifierPatcher from './IdentifierPatcher.js';
import ObjectBodyMemberPatcher from './ObjectBodyMemberPatcher.js';
import find from '../../../utils/array/find.js';
import traverse from '../../../utils/traverse.js';
import type FunctionPatcher from './FunctionPatcher.js';
import type { Editor, Node, ParseContext, Token } from './types.js';

export default class ConstructorPatcher extends ObjectBodyMemberPatcher {
  constructor(node: Node, context: ParseContext, editor: Editor, expression: FunctionPatcher) {
    let virtualKey = new IdentifierPatcher(
      buildVirtualConstructorIdentifierNode(context.tokensForNode(node)),
      context,
      editor
    );
    super(node, context, editor, virtualKey, expression);

    // Constructor methods do not have implicit returns.
    expression.disableImplicitReturns();
  }

  patch(options={}) {
    super.patch(options);
    let boundMethods = this.parent.boundInstanceMethods();
    if (boundMethods.length > 0) {
      let statements = this.expression.body.statements;
      let indexOfSuperStatement = -1;
      for (let i = 0; i < statements.length; i++) {
        let callsSuper = false;
        traverse(statements[i].node, child => {
          if (callsSuper) {
            // Already found it, skip this one.
            return false;
          } else if (child.type === 'Super') {
            // Found it.
            callsSuper = true;
          } else if (child.type === 'Class') {
            // Don't go into other classes.
            return false;
          }
        });
        if (callsSuper) {
          indexOfSuperStatement = i;
          break;
        }
      }
      let bindings = boundMethods.map(method => {
        let key = this.context.source.slice(method.key.start, method.key.end);
        return `this.${key} = this.${key}.bind(this)`;
      });
      this.expression.body.insertLinesAtIndex(bindings, indexOfSuperStatement + 1);
    }
  }

  /**
   * Don't put semicolons after class constructors.
   */
  statementNeedsSemicolon(): boolean {
    return false;
  }
}

function buildVirtualConstructorIdentifierNode(constructorTokens: Array<Token>): Node {
  let constructorToken = find(constructorTokens,
    token => token.type === 'IDENTIFIER' && token.data === 'constructor'
  );
  if (!constructorToken) {
    throw new Error(`cannot find 'constructor' token in class constructor`);
  }
  return {
    type: 'Identifier',
    line: constructorToken.line,
    column: constructorToken.column,
    raw: constructorToken.raw,
    range: constructorToken.range
  };
}
