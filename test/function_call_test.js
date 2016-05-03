import check from './support/check.js';

describe('function calls', () => {
  it('inserts commas after arguments if they are not there', () => {
    check(`
      a(
        1
        2
      )
    `, `
      a(
        1,
        2
      );
    `);
  });

  it('does not insert commas in single-line calls', () => {
    check(`a(1, 2)`, `a(1, 2);`);
  });

  it('inserts commas only for arguments that end a line', () => {
    check(`
      a(
        1, 2
        3, 4)
    `, `
      a(
        1, 2,
        3, 4);
    `);
  });

  it('inserts commas immediately after the element if followed by a comment', () => {
    check(`
      a(
        1 # hi
        2
      )
    `, `
      a(
        1, // hi
        2
      );
    `);
  });

  it('inserts commas on the same line when the property value is an interpolated string', () => {
    check(`
      a
        b: "#{c}"
        d: e
    `, `
      a({
        b: \`\${c}\`,
        d: e
      });
    `);
  });

  it('works when the first argument is parenthesized', () => {
    check(`
      f (1+1),2+2
    `, `
      f((1+1),2+2);
    `);
  });

  it('works when the last argument is parenthesized', () => {
    check(`
      f 1+1,(2+2)
    `, `
      f(1+1,(2+2));
    `);
  });

  it('works with `new` when the first argument is parenthesized', () => {
    check(`
      a= new c ([b()])
    `, `
      let a= new c(([b()]));
    `);
  });

  it('places parentheses in calls with multi-line function arguments after the closing brace', () => {
    check(`
      promise.then ->
        a()
        b # c
      d
    `, `
      promise.then(function() {
        a();
        return b; // c
      });
      d;
    `);
  });

  it('places parentheses in calls with single line that short hand into fat arrow function', () => {
    check(`
      promise.then (a)->
        b
      c
    `, `
      promise.then(a=> b);
      c;
    `);
  });

  it.skip('preserves comments in functions that will become arrow functions', () => {
    check(`
      promise.then (a) ->
        b # c
      d
    `, `
      promise.then(a =>
        b // c
      );
      d;
    `);
  });

  it('replaces the space between the callee and the first argument for first arg on same line', () => {
    check(`a 1, 2`, `a(1, 2);`);
  });

  it('does not add anything if there are already parens', () => {
    check(`a()`, `a();`);
    check(`a(1, 2)`, `a(1, 2);`);
  });

  it('does not add them when present and the callee is surrounded by parentheses', () => {
    check(`(a)()`, `(a)();`);
  });

  it.skip('works with a multi-line callee', () => {
    // FIXME: This doesn't work because FunctionApplicationPatcher thinks it is
    // an implicit call (i.e. no parens), since the token after the function is
    // a newline and not a CALL_START (i.e. ')'). We should switch to coffee-lex
    // tokens and skip past any NEWLINE, COMMENT, or HERECOMMENT tokens.
    check(`
      (->
        1
      )()
    `, `
      (function() {
        return 1;
      )();
    `);
  });

  it('works with a callee enclosed in parentheses and including a comment', () => {
    check(`
      (
        # HEY
        foo
      ) 0
    `, `
      (
        // HEY
        foo
      )(0);
    `);
  });

  it('adds parens for nested function calls', () => {
    check(`a   b  c d     e`, `a(b(c(d(e))));`);
  });

  it('adds parens for a new expression with args', () => {
    check(`new Foo 1`, `new Foo(1);`);
  });

  it('adds parens for a new expression without args', () => {
    check(`new Foo`, `new Foo();`);
  });

  it('adds parens after the properties of a member expression', () => {
    check(`a.b c`, `a.b(c);`);
  });

  it('adds parens after the brackets on a computed member expression', () => {
    check(`a b[c]`, `a(b[c]);`);
  });

  it.skip('adds parens without messing up multi-line calls', () => {
    check(`
      a
        b: c
    `, `
      a({
        b: c
      });
    `);
  });

  it.skip('adds parens to multi-line calls with the right indentation', () => {
    check(`
      ->
        a
          b: c
    `, `
      (function() {
        return a({
          b: c
        });
      });
    `);
  });

  it('converts rest params in function calls', () => {
    check(`(a,b...)->b[0]`, `(a,...b)=> b[0];`);
  });

  it('works when the entire span of arguments is replaced', () => {
    check(`
      a yes
    `, `
      a(true);
    `);
  });

  it('works with a call that returns a function that is immediately called', () => {
    check(`
      a()()
    `, `
      a()();
    `);
  });

  it('deletes trailing comma after the last argument', () => {
    check(`
      x(1,)
    `, `
      x(1);
    `);
  });
});
