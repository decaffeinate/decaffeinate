import check from './support/check.js';

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
      var middle;
      a < (middle = b()) && middle < c;
    `);
  });

  it('picks a temporary variable name that is safe to use', () => {
    check(`
      middle = 1
      a < b() < c
    `, `
      var middle1;
      var middle = 1;
      a < (middle1 = b()) && middle1 < c;
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

  it('works with more than two chained operators', () => {
    check(`
      a < b < c < d
    `, `
      a < b && b < c && c < d;
    `);
  });

  it('works with more than two chained operators with unsafe-to-repeat operands', () => {
    check(`
      a() < b() < c() < d()
    `, `
      var middle;
      var middle1;
      a() < (middle = b()) && middle < (middle1 = c()) && middle1 < d();
    `);
  });

  it('flips the inequalities when used in an `unless`', () => {
    check(`
      unless a < b <= c
        d
    `, `
      if (a >= b || b > c) {
        d;
      }
    `);
  });
});
