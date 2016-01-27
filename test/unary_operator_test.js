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
});
