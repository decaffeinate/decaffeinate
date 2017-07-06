import { strictEqual } from 'assert';
import { parse } from 'decaffeinate-parser';
import countVariableUsages from '../../src/utils/countVariableUsages';

describe('countVariableUsages', () => {
  it('does simple counting within a program', () => {
    let ast = parse(`
      x = 1
      for x in y
        console.log x
    `);
    strictEqual(countVariableUsages(ast, 'x'), 3);
    strictEqual(countVariableUsages(ast, 'y'), 1);
    strictEqual(countVariableUsages(ast, 'z'), 0);
  });
});
