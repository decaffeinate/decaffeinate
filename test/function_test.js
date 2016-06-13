import check from './support/check.js';

describe('functions', () => {
  it('handles functions without a body', () => {
    check(`->`, `(function() {});`);
  });

  it('put the closing curly brace on a new line', () => {
    check(`
      ->
        return
    `, `
      (function() {
        return;
      });
    `);
  });

  it('put the closing curly brace on the same line if the original is a single line', () => {
    check(`
      -> return
    `, `
      (function() { return; });
    `);
  });

  it('puts the closing curly brace before any trailing comments on the last statement in the body', () => {
    check(`
      ->
        return # hey
      b
    `, `
      (function() {
        return; // hey
      });
      b;
    `);
  });

  it('puts the closing punctuation before trailing comments for one-line functions', () => {
    check(`
      -> return # b
    `, `
      (function() { return; }); // b
    `);
  });

  it('puts the closing punctuation before trailing comments for parentheses-wrapped functions', () => {
    check(`
      (->
        return) # b
    `, `
      (function() {
        return;}); // b
    `);
  });

  it.skip('puts the closing punctuation after trailing comments for multi-line bodies', () => {
    check(`
      validExpirationDate = (month, year) ->
        today = new Date()
        fullYear = 2000 + parseInt(year)
        (/^\\d{1,2}$/.test month) and (/^\\d{1,2}$/.test year) and
          (month >= 1 and month <= 12) and
          fullYear >= today.getFullYear() and
          (fullYear isnt today.getFullYear() or month > today.getMonth()) # Date.month is 0 indexed

      module.exports = { validExpirationDate }
    `, `
      let validExpirationDate = function(month, year) {
        let today = new Date();
        let fullYear = 2000 + parseInt(year);
        return (/^\\d{1,2}$/.test(month)) && (/^\\d{1,2}$/.test(year)) &&
          (month >= 1 && month <= 12) &&
          fullYear >= today.getFullYear() &&
          (fullYear !== today.getFullYear() || month > today.getMonth()); // Date.month is 0 indexed
      };

      export { validExpirationDate };
    `);
  });

  it('puts closing curly brace just inside loosely-wrapped function parens', () => {
    check(`
      (->
        @get('delegateEmail') or @get('email')
      ).property('delegateEmail', 'email')
    `, `
      (function() {
        return this.get('delegateEmail') || this.get('email');
      }).property('delegateEmail', 'email');
    `);
  });

  it('handles fat arrow functions without a body', () => {
    check(`=>`, `() => {};`);
  });

  it('leaves fat arrow functions as arrow functions', () => {
    check(`add = (a, b) => a + b`, `let add = (a, b) => a + b;`);
  });

  it('adds a block to fat arrow functions if their body is a block', () => {
    check(`
      add = (a, b) =>
        a + b
    `, `
      let add = (a, b) => {
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

  it('turns functions containing a `yield` statement into generator functions', () => {
    check(`
      -> yield fn()
    `, `
      (function*() { return yield fn(); });
    `);
  });

  it('turns functions containing a `yield from` statement into generator functions', () => {
    check(`
      -> yield from fn()
    `, `
      (function*() { return yield* fn(); });
    `);
  });

  it('keeps function with a spread in baces', () => {
    check(`(args...) =>`, `(...args) => {};`);
  });

  it('keeps function with a single assignment as a parameter in braces', () => {
    check(`(args=false) =>`, `(args=false) => {};`);
  });
});
