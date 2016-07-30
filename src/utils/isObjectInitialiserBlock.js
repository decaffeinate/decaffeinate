/* @flow */
import BlockPatcher from '../stages/main/patchers/BlockPatcher.js';
import ObjectInitialiserPatcher from '../stages/main/patchers/ObjectInitialiserPatcher.js';

import type NodePatcher from '../patchers/NodePatcher.js';

/**
 * Determine if this is a block where the only contents are an object literal.
 */
export default function isObjectInitialiserBlock(patcher: NodePatcher): boolean {
  return patcher instanceof BlockPatcher &&
    patcher.statements.length === 1 &&
    patcher.statements[0] instanceof ObjectInitialiserPatcher;
}
