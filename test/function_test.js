import check from './support/check.js';

describe('functions', () => {
  it('handles functions without a body', () => {
    check(`->`, `(function() {});`);
  });

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

  it('puts the closing punctuation before trailing comments for one-line functions', () => {
    check(`
      -> a # b
    `, `
      (function() { return a; }); // b
    `);
  });

  it('puts the closing punctuation before trailing comments for parentheses-wrapped functions', () => {
    check(`
      (->
        a) # b
    `, `
      (function() {
        return a;
      }); // b
    `);
  });

  it('handles fat arrow functions without a body', () => {
    check(`=>`, `() => {};`);
  });

  it('leaves fat arrow functions as arrow functions', () => {
    check(`add = (a, b) => a + b`, `var add = (a, b) => a + b;`);
  });

  it('adds a block to fat arrow functions if their body is a block', () => {
    check(`
      add = (a, b) =>
        a + b
    `, `
      var add = (a, b) => {
        return a + b;
      };
    `);
  });

  it('wraps the body of fat arrow functions if the body is a sequence', () => {
    check(`=> a; b`, `() => (a, b);`);
  });

  it('unwraps single-parameter fat arrow functions', () => {
    check(`(a) => a`, `a => a;`);
  });

  it('turns fat arrow functions referencing `arguments` into regular functions with a `bind` call', () => {
    check(`
      => arguments[0]
    `, `
      (function() { return arguments[0]; }.bind(this));
    `);
  });
});
