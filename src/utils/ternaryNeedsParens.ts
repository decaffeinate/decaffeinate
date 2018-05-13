import NodePatcher from '../patchers/NodePatcher';
import AssignOpPatcher from '../stages/main/patchers/AssignOpPatcher';
import ConditionalPatcher from '../stages/main/patchers/ConditionalPatcher';
import DynamicMemberAccessOpPatcher from '../stages/main/patchers/DynamicMemberAccessOpPatcher';
import FunctionApplicationPatcher from '../stages/main/patchers/FunctionApplicationPatcher';
import InOpPatcher from '../stages/main/patchers/InOpPatcher';
import SoakedDynamicMemberAccessOpPatcher from '../stages/main/patchers/SoakedDynamicMemberAccessOpPatcher';
import SoakedFunctionApplicationPatcher from '../stages/main/patchers/SoakedFunctionApplicationPatcher';
import SoakedMemberAccessOpPatcher from '../stages/main/patchers/SoakedMemberAccessOpPatcher';
import WhilePatcher from '../stages/main/patchers/WhilePatcher';

/**
 * Given a main stage patcher, determine from the AST if it needs to be wrapped
 * in parens when transformed into a JS ternary.
 *
 * Be defensive by listing all known common cases where this is correct, and
 * requiring parens in all other cases. That way, any missed cases result in
 * slightly ugly code rather than incorrect code.
 */
export default function ternaryNeedsParens(patcher: NodePatcher): boolean {
  if (patcher.hadUnparenthesizedNegation()) {
    return true;
  }
  let { parent } = patcher;
  return !(
    patcher.isSurroundedByParentheses() ||
    (parent instanceof FunctionApplicationPatcher && patcher !== parent.fn) ||
    (parent instanceof DynamicMemberAccessOpPatcher && patcher === parent.indexingExpr) ||
    (parent instanceof ConditionalPatcher &&
      !parent.node.isUnless &&
      patcher === parent.condition &&
      !parent.willPatchAsTernary()) ||
    (parent instanceof WhilePatcher && !parent.node.isUntil && patcher === parent.condition) ||
    parent instanceof InOpPatcher ||
    (parent instanceof AssignOpPatcher && patcher === parent.expression) ||
    // This function is called for soak operations, so outer soak operations
    // will insert a __guard__ helper and thus won't need additional parens.
    (parent instanceof SoakedMemberAccessOpPatcher && patcher === parent.expression) ||
    (parent instanceof SoakedDynamicMemberAccessOpPatcher && patcher === parent.expression) ||
    (parent instanceof SoakedFunctionApplicationPatcher && patcher === parent.fn)
  );
}
