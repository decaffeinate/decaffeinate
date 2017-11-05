import {
  BareSuperFunctionApplication, Class, Node, Super
} from 'decaffeinate-parser/dist/nodes';
import containsDescendant from './containsDescendant';

export default function containsSuperCall(node: Node): boolean {
  return containsDescendant(
    node,
    child => child instanceof Super || child instanceof BareSuperFunctionApplication,
    {shouldStopTraversal: child => child instanceof Class}
  );
}
