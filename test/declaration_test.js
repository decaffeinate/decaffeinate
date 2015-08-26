import check from './support/check';

describe('declarations', () => {
  it('adds inline declarations for assignments as statements', () => {
    check(`a = 1`, `var a = 1;`);
  });

  it('adds separate declarations for assignments as expressions', () => {
    check(`
      a(b = 1)
    `, `
      var b;
      a(b = 1);
    `);
  });

  it('does not add declarations for subsequent assignments to the same binding', () => {
    check(`
      a = 1
      a = 2
    `, `
      var a = 1;
      a = 2;
    `);
  });

  it('does not add declarations for assignments to a declared binding', () => {
    check(`
      (a) ->
        a = 1
    `, `
      (function(a) {
        return a = 1;
      });
    `);
  });

  it('adds separate declarations at the top of the current scope if they cannot be inline', () => {
    check(`
      ->
        a = 1
    `, `
      (function() {
        var a;
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
      var a = 1;
      (function() {
        return a = 2;
      });
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
          var c = 1;
        }
      }
    `);
  });

  it('does not add multiple declarations when the assignment happens at the top of a block', () => {
    check(`
      if a = 1
        b
    `, `
      var a;
      if (a = 1) {
        b;
      }
    `);
  });

  it('does not add variable declarations when the LHS is a member expression', function() {
    check(`a.b = 1`, `a.b = 1;`);
  });

  it('adds variable declarations for destructuring array assignment', function() {
    check(`[a] = b`, `var [a] = b;`);
  });

  it('adds variable declarations for destructuring object assignment', function() {
    check(`{a} = b`, `var {a} = b;`);
  });

  it('does not add variable declarations for destructuring array assignment with previously declared bindings', function() {
    check(`
        a = 1
        [a] = b
      `, `
        var a = 1;
        [a] = b;
      `);
  });

  it('wraps object destructuring that is not part of a variable declaration in parentheses', function() {
    check(`
        a = 1
        {a} = b
      `, `
        var a = 1;
        ({a}) = b;
      `);
  });

  it('adds variable declarations when the destructuring is mixed', function() {
    // FIXME: Is this a good idea? Should we be marking this as an error?
    check(`
        a = 1
        [a, b] = c
      `, `
        var a = 1;
        var [a, b] = c;
      `);
  });

  it('adds pre-declarations when the assignment is in an expression context', function() {
    check(`a(b = c)`, `var b;\na(b = c);`);
  });

  it('adds pre-declarations when the assignment would be implicitly returned', function() {
    check('->\n  a = 1', '(function() {\n  var a;\n  return a = 1;\n});');
  });

  it('adds pre-declarations at the right indent level when the assignment is in an expression context', function() {
    check(`->\n  a(b = c)`, `(function() {\n  var b;\n  return a(b = c);\n});`);
  });

  it('adds pre-declarations and regular declarations together properly', function() {
    check('a = 1\nb = c = 2', 'var c;\nvar a = 1;\nvar b = c = 2;');
  });
});
