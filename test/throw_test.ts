import check, { checkCS1 } from './support/check';

describe('throw', () => {
  it('is preserved when used in a statement context', () => {
    check(`throw new Error()`, `throw new Error();`);
  });

  it('is wrapped in an IIFE when used in an expression context', () => {
    check(`doSomething() or (throw err)`, `doSomething() || (() => { throw err; })();`);
  });

  it('adds wrapping parentheses when used in an expression context without them', () => {
    check(`a(b, throw c, d)`, `a(b, (() => { throw c; })(), d);`);
  });

  it('is not considered an implicitly-returnable value', () => {
    check(
      `
      ->
        if err
          throw 42
    `,
      `
      (function() {
        if (err) {
          throw 42;
        }
      });
    `,
    );
  });

  it('blocks parent conditionals from becoming ternary expressions in single-line functions', () => {
    check(
      `
      -> if a then throw b
    `,
      `
      (function() { if (a) { throw b; } });
    `,
    );
  });

  it('blocks parent conditionals with a `return` from becoming ternary expressions in single-line functions', () => {
    check(
      `
      -> if a then throw b else c
    `,
      `
      (function() { if (a) { throw b; } else { return c; } });
    `,
    );
  });

  it('blocks parent conditionals from becoming ternary expressions in single-line bound functions', () => {
    check(
      `
      => if a then throw b
    `,
      `
      () => { if (a) { throw b; } };
    `,
    );
  });

  it('allows multiline throw statements', () => {
    checkCS1(
      `
      throw
        a
    `,
      `
      throw a;
    `,
    );
  });

  it('allows multiline throw expressions', () => {
    checkCS1(
      `
      (throw
        a)
    `,
      `
      throw a;
    `,
    );
  });

  it('treats the throw target as an expression', () => {
    check(
      `
      throw(res.data?.error)
    `,
      `
      throw(res.data != null ? res.data.error : undefined);
    `,
    );
  });
});
