import check from './support/check';
import validate from './support/validate';

describe('chained comparison', () => {
  it('repeats the middle operand when it is safe', () => {
    check(
      `
      a < b < c
    `,
      `
      a < b && b < c;
    `,
    );

    check(
      `
      a > b > c
    `,
      `
      a > b && b > c;
    `,
    );

    check(
      `
      a <= b <= c
    `,
      `
      a <= b && b <= c;
    `,
    );

    check(
      `
      a >= b >= c
    `,
      `
      a >= b && b >= c;
    `,
    );
  });

  it('saves the middle operand when it is not safe to repeat', () => {
    check(
      `
      a < b() < c
    `,
      `
      let middle;
      a < (middle = b()) && middle < c;
    `,
    );
  });

  it('picks a temporary variable name that is safe to use', () => {
    check(
      `
      middle = 1
      a < b() < c
    `,
      `
      let middle1;
      const middle = 1;
      a < (middle1 = b()) && middle1 < c;
    `,
    );
  });

  it('handles an intermediate expression with nontrivial patching', () => {
    check(
      `
      a < (b ? c) < d
    `,
      `
      let middle;
      a < ((middle = typeof b !== 'undefined' && b !== null ? b : c)) && middle < d;
    `,
    );
  });

  it('is fine being used in an expression context', () => {
    check(
      `
      if a < b < c
        d
    `,
      `
      if (a < b && b < c) {
        d;
      }
    `,
    );
  });

  it('works with more than two chained operators', () => {
    check(
      `
      a < b < c < d
    `,
      `
      a < b && b < c && c < d;
    `,
    );
  });

  it('works with more than two chained operators with unsafe-to-repeat operands', () => {
    check(
      `
      a() < b() < c() < d()
    `,
      `
      let middle, middle1;
      a() < (middle = b()) && middle < (middle1 = c()) && middle1 < d();
    `,
    );
  });

  it('flips the inequalities when used in an `unless` with loose mode specified', () => {
    check(
      `
      unless a < b <= c
        d
    `,
      `
      if (a >= b || b > c) {
        d;
      }
    `,
      {
        options: {
          looseComparisonNegation: true,
        },
      },
    );
  });

  it('does not flip the inequalities when used in an `unless` by default', () => {
    check(
      `
      unless a < b <= c
        d
    `,
      `
      if (!(a < b && b <= c)) {
        d;
      }
    `,
    );
  });

  it('adds variable declarations to enclosing method', () => {
    check(
      `
      d: ->
        a < b() < c
    `,
      `
      ({
        d() {
          let middle;
          return a < (middle = b()) && middle < c;
        }
      });
    `,
    );
  });

  it('expands deeply nested chained operators', () => {
    check(
      `
      a is b isnt c is d isnt e
    `,
      `
      a === b && b !== c && c === d && d !== e;
    `,
    );
  });

  it('does not count parenthesis-wrapped binary operators as part of the chain', () => {
    check(
      `
      (a == b) == c == d == e
    `,
      `
      (a === b) === c && c === d && d === e;
    `,
    );
  });

  it('obeys operator precedence with chained comparison ops', () => {
    validate(
      `
      setResult(1 | 2 < 3 < 4)
    `,
      1,
    );
  });
});
