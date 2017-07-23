import { traverse } from 'decaffeinate-parser';
import { Node } from 'decaffeinate-parser/dist/nodes';

export default function containsSuperCall(node: Node): boolean {
  let foundSuper = false;
  traverse(node, child => {
    if (foundSuper) {
      // Already found it, skip this one.
      return false;
    } else if (child.type === 'Super' || child.type === 'BareSuperFunctionApplication') {
      // Found it.
      foundSuper = true;
    } else if (child.type === 'Class') {
      // Don't go into other classes.
      return false;
    }
    return true;
  });
  return foundSuper;
}
