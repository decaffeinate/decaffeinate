import { Node } from 'decaffeinate-parser';
import CodeContext from './CodeContext';

export default function formatDecaffeinateParserAst(program: Node, context: CodeContext): string {
  const resultLines = formatAstNodeLines(program, context);
  return resultLines.map((line) => line + '\n').join('');
}

function formatAstNodeLines(node: Node, context: CodeContext): Array<string> {
  const propLines = [];
  const childPropNames = node.getChildNames();
  const blacklistedProps = childPropNames.concat([
    'raw',
    'line',
    'column',
    'type',
    'parentNode',
    'context',
    'start',
    'end',
  ]);
  for (const key of Object.keys(node)) {
    if (blacklistedProps.indexOf(key) !== -1) {
      continue;
    }
    let valueText;
    try {
      valueText = JSON.stringify(node[key as keyof typeof node]);
    } catch (e) {
      valueText = '(error)';
    }
    propLines.push(`${key}: ${valueText}`);
  }

  for (const childProp of childPropNames) {
    const value = node[childProp as keyof Node];
    if (value === null) {
      propLines.push(`${childProp}: null`);
    } else if (Array.isArray(value) && value.length === 0) {
      propLines.push(`${childProp}: []`);
    } else if (Array.isArray(value)) {
      propLines.push(`${childProp}: [`);
      for (const child of value) {
        propLines.push(...formatAstNodeLines(child as Node, context).map((s) => '  ' + s));
      }
      propLines.push(`]`);
    } else {
      const childLines = formatAstNodeLines(value as Node, context);
      childLines[0] = `${childProp}: ${childLines[0]}`;
      propLines.push(...childLines);
    }
  }
  const rangeStr = context.formatRange(node.start, node.end);
  return [`${node.type} ${rangeStr} {`, ...propLines.map((s) => '  ' + s), '}'];
}
