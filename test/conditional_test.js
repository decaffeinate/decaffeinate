import check from './support/check';

describe('conditionals', () => {
  it('surrounds `if` conditions in parentheses and bodies in curly braces', () => {
    check(`
      if a
        b
    `, `
      if (a) {
        b;
      }
    `);
  });

  it('surrounds `unless` conditions in parentheses and precedes it with a `!` operator', () => {
    check(`
      unless a
        b
    `, `
      if (!a) {
        b;
      }
    `);
  });

  it('surrounds `unless` conditions in additional parentheses if needed for the `!` operator', () => {
    check(`
      unless a == b
        c
    `, `
      if (!(a === b)) {
        c;
      }
    `);
  });

  it('does not add parentheses if the condition is already surrounded by them', () => {
    check(`
      if (a)
        b
    `, `
      if (a) {
        b;
      }
    `);
    check(`
      unless (a)
        b
    `, `
      if (!a) {
        b;
      }
    `);
  });

  it('correctly inserts parentheses when an `unless` condition requires them when it was surrounded by parentheses', () => {
    check(`
      unless (a == b)
        c
    `, `
      if (!(a === b)) {
        c;
      }
    `);
  });

  it('handles indented `if` statements correctly', () => {
    check(`
      if a
        if b
          c
    `, `
      if (a) {
        if (b) {
          c;
        }
      }
    `);
  });

  it('surrounds the `else` clause of an `if` statement in curly braces', () => {
    check(`
      if a
        b
      else
        c
    `, `
      if (a) {
        b;
      } else {
        c;
      }
    `);
  });

  it('surrounds the `else if` condition in parentheses', () => {
    check(`
      if a
        b
      else if c
        d
    `, `
      if (a) {
        b;
      } else if (c) {
        d;
      }
    `);
  });

  it('works with several `else if` clauses and an `else`', () => {
    check(`
      if a
        b
      else if c
        d
      else if e
        f
      else
        g
    `, `
      if (a) {
        b;
      } else if (c) {
        d;
      } else if (e) {
        f;
      } else {
        g;
      }
    `);
  });

  it('works with `if` with immediate return', () => {
    check(`
      ->
        if a
          b
      c
    `, `
      (function() {
        if (a) {
          return b;
        }
      });
      c;
    `);
  });

  it('keeps single-line `if` statements on one line', () => {
    check(`if a then b`, `if (a) { b; }`);
  });

  it('keeps single-line `if` with `else` on one line', () => {
    check(`if a then b else c`, `if (a) { b; } else { c; }`);
  });

  it('turns simple `if` with `else` as an expression into a ternary operator', () => {
    check(`a(if b then c else d)`, `a(b ? c : d);`);
  });

  it('turns simple `if` without `else` as an expression into a ternary operator with undefined', () => {
    check(`a(if b then c)`, `a(b ? c : undefined);`);
  });

  it('adds ternary operator code after any insertions for the consequent', () => {
    check(`a(if b then c: d)`, `a(b ? ({c: d}) : undefined);`);
  });

  it('wraps multi-line conditionals used as expressions in an IIFE', () => {
    check(`
      ->
        z(if a
          c = a
          a + c
        else
          d = a
          a - d)
    `, `
      (function() {
        return z((() => {
          if (a) {
            var c = a;
            return a + c;
          } else {
            var d = a;
            return a - d;
          }
        })());
      });
    `);
  });

  it('keeps single-line POST-`if`', () => {
    check(`a if b`, `if (b) { a; }`);
    check(`
      ->
        return if a is b
        null
      `, `
        (function() {
          if (a === b) { return; }
          return null;
        });
    `);
  });

  it('keeps single-line POST-`unless`', () => {
    check(`a unless b`, `if (!b) { a; }`);
  });

  it('pushes returns into `if` statements', () => {
    check(`
      ->
        if a
          b
    `, `
      (function() {
        if (a) {
          return b;
        }
      });
    `);
  });

  it('pushes returns into `else if` blocks', () => {
    check(`
      ->
        if a
          b
        else if c
          d
    `, `
      (function() {
        if (a) {
          return b;
        } else if (c) {
          return d;
        }
      });
    `);
  });

  it('works with if then throw inline', () => {
    check(`if a then throw new Error "Error"`, `if (a) { throw new Error("Error"); }`);
  });

  it('works with POST-`if` as the body of a function', () => {
    check(`-> a if b`, `(function() { return b ? a : undefined; });`);
  });
});
