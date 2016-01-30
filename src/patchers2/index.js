import BinaryOpPassthroughPatcher from './BinaryOpPassthroughPatcher';
import BlockPatcher from './BlockPatcher';
import BoolPatcher from './BoolPatcher';
import FunctionApplicationPatcher from './FunctionApplicationPatcher';
import FunctionPatcher from './FunctionPatcher';
import PassthroughPatcher from './PassthroughPatcher';
import ProgramPatcher from './ProgramPatcher';
import ReturnPatcher from './ReturnPatcher';
import { childPropertyNames } from '../utils/traverse';

export function makePatcher(node, context, magicString, allPatchers=[]) {
  let constructor;
  let props = childPropertyNames(node);

  switch (node.type) {
    case 'Identifier':
    case 'Int':
      constructor = PassthroughPatcher;
      break;

    case 'FunctionApplication':
      constructor = FunctionApplicationPatcher;
      break;

    case 'Function':
      constructor = FunctionPatcher;
      break;

    case 'Bool':
      constructor = BoolPatcher;
      break;

    case 'Block':
      constructor = BlockPatcher;
      break;

    case 'Return':
      constructor = ReturnPatcher;
      break;

    case 'Program':
      constructor = ProgramPatcher;
      break;

    case 'PlusOp':
    case 'SubtractOp':
      constructor = BinaryOpPassthroughPatcher;
      break;

    default:
      throw new Error(`no patcher available for node type: ${node.type}${props.length ? ` (props: ${props.join(', ')})` : ''}`);
  }

  let children = props.map(name => {
    let child = node[name];
    if (!child) {
      return null;
    } else if (Array.isArray(child)) {
      return child.map(item => makePatcher(item, context, magicString, allPatchers));
    } else {
      return makePatcher(child, context, magicString, allPatchers);
    }
  });

  let patcher = new constructor(node, context, magicString, ...children);
  allPatchers.push(patcher);
  children.forEach(child => {
    if (Array.isArray(child)) {
      child.forEach(item => item.parent = patcher);
    } else {
      child.parent = patcher;
    }
  });

  if (node.type === 'Program') {
    allPatchers.forEach(patcher => patcher.initialize());
  }

  return patcher;
}
