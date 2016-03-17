import check from './support/check.js';

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
      if (a !== b) {
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
      if (a !== b) {
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

  it('handles `if` statements with an implicit call in the condition', () => {
    check(`if a b then c`, `if (a(b)) { c; }`);
  });

  it('turns simple `if` with `else` as an expression into a ternary operator', () => {
    check(`a(if b then c else d)`, `a(b ? c : d);`);
  });

  it('turns simple `if` without `else` as an expression into a ternary operator with undefined', () => {
    check(`a(if b then c)`, `a(b ? c : undefined);`);
  });

  it('adds ternary operator code after any insertions for the consequent', () => {
    check(`a(if b then c: d)`, `a(b ? {c: d} : undefined);`);
  });

  it('turns multi-line `if` into a ternary with sequence expressions', () => {
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
        let c;
        let d;
        return z(a ?
          (c = a,
          a + c)
        :
          (d = a,
          a - d));
      });
    `);
  });

  it.skip('keeps single-line POST-`if`', () => {
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

  it.skip('keeps single-line POST-`unless`', () => {
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
    check(`if a then throw err`, `if (a) { throw err; }`);
  });

  it('works with POST-`if` as the body of a function', () => {
    check(`-> a if b`, `(function() { if (b) { return a; } });`);
  });

  it('works with nested POST-`if`', () => {
    check(`
      a b if c d unless e f
    `, `
      if (!e(f)) { if (c(d)) { a(b); } }
    `);
  });

  it('surrounds the conditional expression in parens as part of a binary expression', () => {
    check(`
      a + if b then c else d
    `, `
      a + (b ? c : d);
    `);
  });

  it('surrounds the conditional expression in parens as part of a unary expression', () => {
    check(`
      -if b then c else d
    `, `
      -(b ? c : d);
    `);
  });

  it('does not add extra parens to a conditional expression', () => {
    check(`
      a + (if b then c else d)
    `, `
      a + (b ? c : d);
    `);
  });

  it('does not add unnecessary parens to a conditional expression', () => {
    check(`
      a ** if b then c else d
    `, `
      Math.pow(a, b ? c : d);
    `);
  });
});
