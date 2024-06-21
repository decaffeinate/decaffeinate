import { strictEqual } from 'assert';
import { parse } from 'decaffeinate-parser';
import countVariableUsages from '../../src/utils/countVariableUsages';

describe('countVariableUsages', () => {
  it('does simple counting within a program', () => {
    const ast = parse(`
      x = 1
      for x in y
        console.log x
    `);
    strictEqual(countVariableUsages(ast, 'x'), 3);
    strictEqual(countVariableUsages(ast, 'y'), 1);
    strictEqual(countVariableUsages(ast, 'z'), 0);
  });

  it('does not count member access properties as a variable usage', () => {
    const ast = parse(`
      x = 1
      y.x
    `);
    strictEqual(countVariableUsages(ast, 'x'), 1);
    strictEqual(countVariableUsages(ast, 'y'), 1);
  });

  it('does not count object keys as variable usages', () => {
    const ast = parse(`
      x = 1
      { x: 2 }
    `);
    strictEqual(countVariableUsages(ast, 'x'), 1);
  });

  it('counts object shorthand values as variable usages', () => {
    const ast = parse(`
      x = 1
      { x }
    `);
    strictEqual(countVariableUsages(ast, 'x'), 2);
  });

  it('counts a computed object key as a variable usage', () => {
    const ast = parse(
      `
      x = 1
      { [x]: 2 }
    `,
      { useCS2: true },
    );
    strictEqual(countVariableUsages(ast, 'x'), 2);
  });
});
