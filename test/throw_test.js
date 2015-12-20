import check from './support/check';

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
    check(`
      ->
        if err
          throw 42
    `, `
      (function() {
        if (err) {
          throw 42;
        }
      });
    `);
  });
});
