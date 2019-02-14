import check, { checkCS1, checkCS2 } from './support/check';

describe('declarations', () => {
  it('adds inline declarations for assignments as statements', () => {
    check(`a = 1`, `const a = 1;`);
  });

  it('adds separate declarations for assignments as expressions', () => {
    check(
      `
      a(b = 1)
    `,
      `
      let b;
      a(b = 1);
    `
    );
  });

  it('does not add declarations for subsequent assignments to the same binding', () => {
    check(
      `
      a = 1
      a = 2
    `,
      `
      let a = 1;
      a = 2;
    `
    );
  });

  it('does not add declarations for assignments to a declared binding', () => {
    check(
      `
      (a) ->
        a = 1
    `,
      `
      a => a = 1;
    `
    );
  });

  it('adds separate declarations at the top of the current scope if they cannot be inline', () => {
    check(
      `
      ->
        a = 1
    `,
      `
      (function() {
        let a;
        return a = 1;
      });
    `
    );
  });

  it('does not add declarations for assignments to a binding if the parent scope defines the binding', () => {
    check(
      `
      a = 1
      ->
        a = 2
    `,
      `
      let a = 1;
      () => a = 2;
    `
    );
  });

  it('adds declarations at the top of the block in which they are defined', () => {
    check(
      `
      if a
        if b
          c = 1
    `,
      `
      if (a) {
        if (b) {
          const c = 1;
        }
      }
    `
    );
  });

  it('does not add multiple declarations when the assignment happens at the top of a block', () => {
    check(
      `
      if a = 1
        b
    `,
      `
      let a;
      if (a = 1) {
        b;
      }
    `
    );
  });

  it('does not add variable declarations when the LHS is a member expression', () => {
    check(`a.b = 1`, `a.b = 1;`);
  });

  it('adds variable declarations for destructuring array assignment', () => {
    checkCS1(`[a] = b`, `const [a] = Array.from(b);`);
    checkCS2(`[a] = b`, `const [a] = b;`);
  });

  it('adds variable declarations for destructuring object assignment', () => {
    check(`{a} = b`, `const {a} = b;`);
  });

  it('does not add variable declarations for destructuring array assignment with previously declared bindings', () => {
    checkCS1(
      `
      a = 1
      [a] = b
    `,
      `
      let a = 1;
      [a] = Array.from(b);
    `
    );
    checkCS2(
      `
      a = 1
      [a] = b
    `,
      `
      let a = 1;
      [a] = b;
    `
    );
  });

  it('wraps object destructuring that is not part of a variable declaration in parentheses', () => {
    check(
      `
      a = 1
      {a} = b
    `,
      `
      let a = 1;
      ({a} = b);
    `
    );
  });

  it('adds inline variable declarations when destructuring includes a default value assignment pattern (#1361)', () => {
    checkCS2(
      `
      { data = {}, status, statusText } = e.response || {}
      `,
      `
      const { data = {}, status, statusText } = e.response || {};
      `
    );
  });

  it('does not add inline variable declarations when the destructuring is mixed', () => {
    checkCS1(
      `
      a = 1
      [a, b] = c
    `,
      `
      let b;
      let a = 1;
      [a, b] = Array.from(c);
    `
    );
    checkCS2(
      `
      a = 1
      [a, b] = c
    `,
      `
      let b;
      let a = 1;
      [a, b] = c;
    `
    );
  });

  it('adds pre-declarations when the assignment is in an expression context', () => {
    check(`a(b = c)`, `let b;\na(b = c);`);
  });

  it('adds pre-declarations when the assignment would be implicitly returned', () => {
    check('->\n  a = 1', '(function() {\n  let a;\n  return a = 1;\n});');
  });

  it('adds pre-declarations at the right indent level when the assignment is in an expression context', () => {
    check(`->\n  a(b = c)`, `(function() {\n  let b;\n  return a(b = c);\n});`);
  });

  it('adds pre-declarations and regular declarations together properly', () => {
    check(
      `
      a = 1
      b = c = 2
    `,
      `
      let c;
      const a = 1;
      const b = (c = 2);
    `
    );
  });

  it('uses let rather than const if specified', () => {
    check('a = 1', 'let a = 1;', {
      options: {
        preferLet: true
      }
    });
  });
});
