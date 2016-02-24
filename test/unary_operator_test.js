import check from './support/check';

describe('unary operators', () => {
  it('passes bitwise negation through', () => {
    check(`~0`, `~0;`);
  });

  it('transforms `not` to `!` and removes the space if one is present', () => {
    check(`not a`, `!a;`);
  });

  it('transforms `not` to `!` with parentheses', () => {
    check(`not(a)`, `!(a);`);
  });

  it('passes double-not using `!` through', () => {
    check(`!!a`, `!!a;`);
  });

  it('transforms double-not using `not` to double-`!`', () => {
    check(`not not a`, `!!a;`);
  });

  it('transforms nested-nots with parentheses', () => {
    check(`not (!(not b))`, `!(!(!b));`);
  });

  it('transforms `not` to `!` when used in a condition', () => {
    check(`
      if not 0
        1
    `, `
      if (!0) {
        1;
      }
    `);
  });

  it('preserves typeof operators', () => {
    check(`typeof a`, `typeof a;`);
  });

  it.skip('converts unary existential identifier checks to typeof + null check', () => {
    check(`a?`, `typeof a !== 'undefined' && a !== null;`);
  });

  it.skip('converts unary existential non-identifier to non-strict null check', () => {
    check(`a.b?`, `a.b != null;`);
    check(`0?`, `0 != null;`);
  });

  it.skip('surrounds unary existential operator results if needed', () => {
    check(`a? or b?`, `(typeof a !== 'undefined' && a !== null) || (typeof b !== 'undefined' && b !== null);`);
    check(`0? or 1?`, `(0 != null) || (1 != null);`);
  });
});
