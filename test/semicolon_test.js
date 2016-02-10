import check from './support/check';

describe('semicolons', () => {
  it('are inserted after all the parentheses surrounding statements', () => {
    check(`
      ((->
        result)())
    `, `
      ((function() {
        return result;
      })());
    `);
  });

  it('are inserted after the closing function braces for a function expression', () => {
    check(`
      a = ->
        b # c
      d
    `, `
      var a = function() {
        return b; // c
      };
      d;
    `);
  });

  it('adds them after call expressions as statements', () => {
    check(`a b`, `a(b);`);
  });

  it('does not add them when they are already present ending a line', () => {
    check(`a;`, `a;`);
  });

  it('does not add them when they are already present with multiple statements on one line', () => {
    check(`a;b`, `a;b;`);
  });

  it('does not add them when they are already present following whitespace', () => {
    check(`a b ; c d`, `a(b);  c(d);`);
  });

  it('adds them after identifiers as statements', () => {
    check(`a`, `a;`);
  });

  it('adds them after assignments', () => {
    check(`a = 1`, `var a = 1;`);
  });

  it('does not add them after `if` statements', () => {
    check(`
      if a
        b
    `, `
      if (a) {
        b;
      }
    `);
  });

  it('does not add them after `for` loops', () => {
    check(`
      for a in b
        a
    `, `
      for (var i = 0, a; i < b.length; i++) {
        a = b[i];
        a;
      }
    `);
    check(`
      for a of b
        a
    `, `
      for (var a in b) {
        a;
      }
    `);
  });

  it('does not add them after `while` loops', () => {
    check(`
      while a
        a
    `, `
      while (a) {
        a;
      }
    `);
  });

  it('does not add them after `loop` loops', () => {
    check(`
      loop
        a
    `, `
      while (true) {
        a;
      }
    `);
  });

  it('breaks what would otherwise be an unintended multi-line call', () => {
    // https://github.com/decaffeinate/decaffeinate/issues/65#issuecomment-182250564
    check(`
      x = 1
      -> 2
    `, `
      var x = 1;
      (function() { return 2; });
    `);
  });
});
