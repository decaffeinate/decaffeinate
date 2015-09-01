import check from './support/check';

describe('functions', () => {
  it('put the closing curly brace on a new line', () => {
    check(`
      ->
        a
    `, `
      (function() {
        return a;
      });
    `);
  });

  it('put the closing curly brace on the same line if the original is a single line', () => {
    check(`
      -> a
    `, `
      (function() { return a; });
    `);
  });

  it('puts the closing curly brace before any trailing comments on the last statement in the body', () => {
    check(`
      ->
        a # hey
      b
    `, `
      (function() {
        return a; // hey
      });
      b;
    `);
  });
});
