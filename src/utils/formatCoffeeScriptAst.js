import formatCoffeeScriptLocationData from './formatCoffeeScriptLocationData.js';

export default function formatCoffeeScriptAst(context): string {
  let resultLines = formatAstNodeLines(context.ast, context);
  return resultLines.map(line => line + '\n').join('');
}

function formatAstNodeLines(node, context) {
  let propLines = [];
  let blacklistedProps = ['locationData'];
  // Show the non-node children first.
  for (let key of Object.keys(node)) {
    let value = node[key];
    if (shouldTraverse(value) || blacklistedProps.indexOf(key) !== -1) {
      continue;
    }
    let valueText;
    try {
      valueText = JSON.stringify(value);
    } catch (e) {
      valueText = '(error)';
    }
    propLines.push(`${key}: ${valueText}`);
  }

  // Then show the node children.
  for (let key of Object.keys(node)) {
    let value = node[key];
    if (!shouldTraverse(value)) {
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      propLines.push(`${key}: []`);
    } else if (Array.isArray(value)) {
      propLines.push(`${key}: [`);
      for (let child of value) {
        propLines.push(...formatAstNodeLines(child, context).map(s => '  ' + s));
      }
      propLines.push(`]`);
    } else {
      let childLines = formatAstNodeLines(value, context);
      childLines[0] = `${key}: ${childLines[0]}`;
      propLines.push(...childLines);
    }
  }
  return [
    `${node.constructor.name} ${formatCoffeeScriptLocationData(node.locationData, context)} {`,
    ...propLines.map(s => '  ' + s),
    '}',
  ];
}

function shouldTraverse(value) {
  if (Array.isArray(value)) {
    return value.length === 0 || isNode(value[0]);
  }
  return isNode(value);
}

/**
 * CoffeeScript AST nodes are always instances of a custom class, so use the
 * constructor name to distinguish between node children and non-node children.
 */
function isNode(value) {
  if (!value) {
    return false;
  }
  return ['String', 'Number', 'Boolean', 'Array', 'Object'].indexOf(value.constructor.name) === -1;
}
