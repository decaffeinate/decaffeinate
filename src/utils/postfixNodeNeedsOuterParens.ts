import { SourceType } from 'coffee-lex';
import {Spread} from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../patchers/NodePatcher';
import ObjectInitialiserPatcher from '../stages/normalize/patchers/ObjectInitialiserPatcher';

/**
 * Determine if the given postfix if/while/for needs to have parens wrapped
 * around it while it is reordered. This happens when the expression has a comma
 * after it as part of a list (function args, array initializer, or object
 * initializer). It also happens when there is a semicolon immediately
 * afterward, since without the parens the next statement would be pulled into
 * the block. It also happens when the expression is within a spread node, since
 * otherwise there are precedence issues.
 */
export default function postfixNodeNeedsOuterParens(patcher: NodePatcher): boolean {
  let parent = patcher.parent;
  if (parent) {
    if (parent.node instanceof Spread) {
      return true;
    }
    let grandparent = parent.parent;
    if (
      grandparent &&
      grandparent instanceof ObjectInitialiserPatcher &&
      grandparent.isImplicitObjectInitializer()
    ) {
      return true;
    }
  }

  let nextToken = patcher.nextSemanticToken();
  if (nextToken) {
    return nextToken.type === SourceType.COMMA || nextToken.type === SourceType.SEMICOLON;
  }
  return false;
}
