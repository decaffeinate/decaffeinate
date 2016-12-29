import check from './support/check';

describe('comparisons', () => {
  it('leaves less-than operators alone', () => {
    check(`a < b`, `a < b;`);
    check(`a <= b`, `a <= b;`);
  });

  it('leaves greater-than operators alone', () => {
    check(`a > b`, `a > b;`);
    check(`a >= b`, `a >= b;`);
  });

  it('flips comparisons when used with an `unless`', () => {
    check(`
      unless a < b
        c
    `, `
      if (a >= b) {
        c;
      }
    `);
  });

  it('flips nested comparisons when used with an `unless`', () => {
    check(`
      unless a < b && b > c
        d
    `, `
      if ((a >= b) || (b <= c)) {
        d;
      }
    `);
  });

  it('puts parens around an assignment within a comparison operator', () => {
    check(`
      a is b = c
    `, `
      let b;
      a === (b = c);
    `);
  });
});
