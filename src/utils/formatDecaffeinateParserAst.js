import formatRange from './formatRange';
import {childPropertyNames} from './traverse';

export default function formatDecaffeinateParserAst(ast): string {
  let resultLines = formatAstNodeLines(ast, ast.context);
  return resultLines.map(line => line + '\n').join('');
}

function formatAstNodeLines(node, context) {
  let propLines = [];
  let childPropNames = childPropertyNames(node);
  let blacklistedProps = childPropNames.concat(
    ['raw', 'line', 'column', 'type', 'range', 'virtual', 'scope', 'parentNode', 'context', 'start', 'end']
  );
  for (let key of Object.keys(node)) {
    if (blacklistedProps.indexOf(key) !== -1) {
      continue;
    }
    let valueText;
    try {
      valueText = JSON.stringify(node[key]);
    } catch (e) {
      valueText = '(error)';
    }
    propLines.push(`${key}: ${valueText}`);
  }

  for (let childProp of childPropNames) {
    let value = node[childProp];
    if (value === null) {
      propLines.push(`${childProp}: null`);
    } else if (Array.isArray(value) && value.length === 0) {
      propLines.push(`${childProp}: []`);
    } else if (Array.isArray(value)) {
      propLines.push(`${childProp}: [`);
      for (let child of value) {
        propLines.push(...formatAstNodeLines(child, context).map(s => '  ' + s));
      }
      propLines.push(`]`);
    } else {
      let childLines = formatAstNodeLines(value, context);
      childLines[0] = `${childProp}: ${childLines[0]}`;
      propLines.push(...childLines);
    }
  }
  let rangeStr;
  if (node.virtual) {
    rangeStr = '(virtual)';
  } else {
    rangeStr = formatRange(node.range[0], node.range[1], context);
  }
  return [
    `${node.type} ${rangeStr} {`,
    ...propLines.map(s => '  ' + s),
    '}',
  ];
}
