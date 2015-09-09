import getFreeBinding from '../utils/getFreeBinding';
import isSafeToRepeat from '../utils/isSafeToRepeat';

export default function preprocessSoakedFunctionApplication(node, patcher) {
  if (node.type === 'SoakedFunctionApplication') {
    const args = patcher.original.slice(node.function.range[1] + '?'.length, node.range[1]);
    let typeofArgument;
    let fn;

    if (isSafeToRepeat(node.function)) {
      // `a?()` -> `if typeof a == "function" then a()`
      typeofArgument = node.function.raw;
      fn = node.function.raw;
    } else {
      // `a(1)?()` -> `if typeof (fn = a(1)) == "function" then fn()`
      fn = getFreeBinding(node.scope, 'fn');
      typeofArgument = `(${fn} = ${node.function.raw})`;
    }

    patcher.overwrite(
      node.range[0],
      node.range[1],
      `if typeof ${typeofArgument} == "function" then ${fn}${args}`
    );

    return true;
  }
}
