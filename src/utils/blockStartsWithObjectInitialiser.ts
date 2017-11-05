import { ObjectInitialiser } from 'decaffeinate-parser/dist/nodes';
import NodePatcher from '../patchers/NodePatcher';
import BlockPatcher from '../stages/main/patchers/BlockPatcher';
import containsDescendant from './containsDescendant';

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
  return containsDescendant(statement.node, child =>
    child instanceof ObjectInitialiser && child.start === statement.contentStart);
}
