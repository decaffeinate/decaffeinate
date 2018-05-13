import check from './support/check';

describe('parameter assignment', () => {
  it('allows assigning as a typical local binding', () => {
    check(
      `
      (a) ->
    `,
      `
      (function(a) {});
    `
    );
  });

  it('allows assigning to a `this` property', () => {
    check(
      `
      (@a) ->
    `,
      `
      (function(a) {
        this.a = a;
      });
    `
    );
  });

  it('allows assigning to multiple `this` properties', () => {
    check(
      `
      (@a, @b) ->
    `,
      `
      (function(a, b) {
        this.a = a;
        this.b = b;
      });
    `
    );
  });

  it('adds assignments to `this` properties before any function body', () => {
    check(
      `
      (@a, @b) ->
        @a + @b
    `,
      `
      (function(a, b) {
        this.a = a;
        this.b = b;
        return this.a + this.b;
      });
    `
    );
  });

  it('does not clobber any variables declared in the function scope', () => {
    check(
      `
      a = 1
      (@a, @b) ->
        b = 2
        a + b
    `,
      `
      const a = 1;
      (function(a1, b1) {
        this.a = a1;
        this.b = b1;
        const b = 2;
        return a + b;
      });
    `
    );
  });

  it('inserts the assignments at the right indentation', () => {
    check(
      `
      if true
        (@a) ->
          @a
    `,
      `
      if (true) {
        (function(a) {
          this.a = a;
          return this.a;
        });
      }
    `
    );
  });

  it('inserts all assignments with the right indentation', () => {
    check(
      `
      z()

      a: (@b) ->
          @b
    `,
      `
      z();

      ({
          a(b) {
              this.b = b;
              return this.b;
          }
      });
    `
    );
  });

  it('works as expected for struct-like class constructors', () => {
    check(
      `
      class Point
        constructor: (@x, @y) ->
    `,
      `
      class Point {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      }
    `
    );
  });

  it('works with default parameters', () => {
    check(
      `
      (@a=1) ->
    `,
      `
      (function(a) {
        if (a == null) { a = 1; }
        this.a = a;
      });
    `
    );
  });

  it('ensures parameters with default values are not redeclared', () => {
    check(
      `
      (a=0) ->
        a ?= 1
    `,
      `
      (function(a) {
        if (a == null) { a = 0; }
        return a != null ? a : (a = 1);
      });
    `
    );
  });
});
