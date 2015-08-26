import check from './support/check';

describe('chained comparison', () => {
  it('repeats the middle operand when it is safe', () => {
    check(`
      a < b < c
    `, `
      a < b && b < c;
    `);

    check(`
      a > b > c
    `, `
      a > b && b > c;
    `);

    check(`
      a <= b <= c
    `, `
      a <= b && b <= c;
    `);

    check(`
      a >= b >= c
    `, `
      a >= b && b >= c;
    `);
  });

  it('saves the middle operand when it is not safe to repeat', () => {
    check(`
      a < b() < c
    `, `
      var ref;
      a < (ref = b()) && ref < c;
    `);
  });

  it('picks a temporary variable name that is safe to use', () => {
    check(`
      ref = 1
      a < b() < c
    `, `
      var ref1;
      var ref = 1;
      a < (ref1 = b()) && ref1 < c;
    `);
  });

  it('is fine being used in an expression context', () => {
    check(`
      if a < b < c
        d
    `, `
      if (a < b && b < c) {
        d;
      }
    `);
  });
});
