import { traverse } from 'decaffeinate-parser';
import NodePatcher from '../patchers/NodePatcher';
import BlockPatcher from '../stages/main/patchers/BlockPatcher';

/**
 * Determine if this is a block has an object initializer as its leftmost node.
 * That means that in its JS form, the expression will start with a `{`
 * character and need to be wrapped in parens when used in a JS arrow function.
 */
export default function blockStartsWithObjectInitialiser(patcher: NodePatcher): boolean {
  if (!(patcher instanceof BlockPatcher) || patcher.statements.length !== 1) {
    return false;
  }
  let statement = patcher.statements[0];
  let foundInitialObject = false;
  traverse(statement.node, child => {
    if (foundInitialObject) {
      // Already found.
      return false;
    }
    if (child.type === 'ObjectInitialiser' && child.start === statement.contentStart) {
      foundInitialObject = true;
      return false;
    }
    return true;
  });
  return foundInitialObject;
}
