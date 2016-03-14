import check from './support/check.js';

describe('declarations', () => {
  it('adds inline declarations for assignments as statements', () => {
    check(`a = 1`, `let a = 1;`);
  });

  it('adds separate declarations for assignments as expressions', () => {
    check(`
      a(b = 1)
    `, `
      let b;
      a(b = 1);
    `);
  });

  it('does not add declarations for subsequent assignments to the same binding', () => {
    check(`
      a = 1
      a = 2
    `, `
      let a = 1;
      a = 2;
    `);
  });

  it('does not add declarations for assignments to a declared binding', () => {
    check(`
      (a) ->
        a = 1
    `, `
      a => a = 1;
    `);
  });

  it('adds separate declarations at the top of the current scope if they cannot be inline', () => {
    check(`
      ->
        a = 1
    `, `
      (function() {
        let a;
        return a = 1;
      });
    `);
  });

  it('does not add declarations for assignments to a binding if the parent scope defines the binding', () => {
    check(`
      a = 1
      ->
        a = 2
    `, `
      let a = 1;
      () => a = 2;
    `);
  });

  it('adds declarations at the top of the block in which they are defined', () => {
    check(`
      if a
        if b
          c = 1
    `, `
      if (a) {
        if (b) {
          let c = 1;
        }
      }
    `);
  });

  it('does not add multiple declarations when the assignment happens at the top of a block', () => {
    check(`
      if a = 1
        b
    `, `
      let a;
      if (a = 1) {
        b;
      }
    `);
  });

  it('does not add variable declarations when the LHS is a member expression', () => {
    check(`a.b = 1`, `a.b = 1;`);
  });

  it('adds variable declarations for destructuring array assignment', () => {
    check(`[a] = b`, `let [a] = b;`);
  });

  it('adds variable declarations for destructuring object assignment', () => {
    check(`{a} = b`, `let {a} = b;`);
  });

  it('does not add variable declarations for destructuring array assignment with previously declared bindings', () => {
    check(`
      a = 1
      [a] = b
    `, `
      let a = 1;
      [a] = b;
    `);
  });

  it('wraps object destructuring that is not part of a variable declaration in parentheses', () => {
    check(`
      a = 1
      {a} = b
    `, `
      let a = 1;
      ({a} = b);
    `);
  });

  it('does not add inline variable declarations when the destructuring is mixed', () => {
    check(`
      a = 1
      [a, b] = c
    `, `
      let b;
      let a = 1;
      [a, b] = c;
    `);
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
    check('a = 1\nb = c = 2', 'let c;\nlet a = 1;\nlet b = c = 2;');
  });
});
