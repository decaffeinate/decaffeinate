import { Identifier, Node } from 'decaffeinate-parser/dist/nodes';
import containsDescendant from './containsDescendant';
import { isFunction } from './types';

export default function referencesArguments(node: Node): boolean {
  return containsDescendant(
    node,
    child => child instanceof Identifier && child.data === 'arguments',
    {shouldStopTraversal: child => child !== node && isFunction(child)}
  );
}
