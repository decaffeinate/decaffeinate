import { Base as CS1Base } from 'decaffeinate-coffeescript/lib/coffee-script/nodes';
import { Base as CS2Base } from 'decaffeinate-coffeescript2/lib/coffeescript/nodes';
import CodeContext from './CodeContext';
import formatCoffeeScriptLocationData from './formatCoffeeScriptLocationData';

export default function formatCoffeeScriptAst(program: CS1Base | CS2Base, context: CodeContext): string {
  let resultLines = formatAstNodeLines(program, context);
  return resultLines.map(line => line + '\n').join('');
}

function formatAstNodeLines(node: CS1Base | CS2Base, context: CodeContext): Array<string> {
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
        if (Array.isArray(child)) {
          propLines.push(`  [`);
          for (let grandchild of child) {
            propLines.push(...formatAstNodeLines(grandchild, context).map(s => '    ' + s));
          }
          propLines.push(`  ]`);
        } else {
          propLines.push(...formatAstNodeLines(child, context).map(s => '  ' + s));
        }
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
    '}'
  ];
}

// tslint:disable-next-line no-any
function shouldTraverse(value: any): boolean {
  if (Array.isArray(value)) {
    return value.length === 0 || shouldTraverse(value[0]);
  }
  return value instanceof CS1Base || value instanceof CS2Base;
}
