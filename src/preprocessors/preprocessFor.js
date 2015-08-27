import getFreeBinding from '../utils/getFreeBinding';
import isSafeToRepeat from '../utils/isSafeToRepeat';
import prependLinesToBlock from '../utils/prependLinesToBlock';

export default function preprocessFor(node, patcher) {
  if (node.type === 'ForOf') {
    const { keyAssignee, valAssignee, target, scope } = node;
    if (valAssignee) {
      // e.g. `for k, v of o` -> `for k of o` and `v = o[k]`
      let canRepeatIterable = isSafeToRepeat(target);
      let iterable = canRepeatIterable ? target.raw : getFreeBinding(scope, 'iterable');

      if (!canRepeatIterable) {
        patcher.overwrite(target.range[0], target.range[1], `(${iterable} = ${target.raw})`);
      }

      let assignments = [];
      let key = keyAssignee.raw;

      if (keyAssignee.type !== 'Identifier') {
        // destructured key, use a temporary variable for the key
        key = getFreeBinding(scope, 'key');
        patcher.overwrite(keyAssignee.range[0], keyAssignee.range[1], key);
        assignments.push(`${keyAssignee.raw} = ${key}`);
      }

      // e.g. `for k, v of o` -> `for k in o`
      //            ^^^
      patcher.remove(keyAssignee.range[1], valAssignee.range[1]);
      assignments.push(`${valAssignee.raw} = ${iterable}[${key}]`);
      prependLinesToBlock(patcher, assignments, node.body);
      return true;
    }
  } else if (node.type === 'ForIn') {
    // Make all for-in loops have a key assignee.
    if (!node.keyAssignee) {
      patcher.insert(node.valAssignee.range[1], `, ${getFreeBinding(node.scope, 'i')}`);
      return true;
    }
  }
}
