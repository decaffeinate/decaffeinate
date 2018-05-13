import check from './support/check';

describe('`new` operator', () => {
  it('inserts missing commas after arguments', () => {
    check(
      `
      new Serializer(
        a
        b
      )
    `,
      `
      new Serializer(
        a,
        b
      );
    `
    );
  });

  it('inserts missing parentheses in a call with arguments', () => {
    check(
      `
      new Array 1
    `,
      `
      new Array(1);
    `
    );
  });

  it('leaves missing parentheses off in a call with no arguments', () => {
    check(
      `
      new Object
    `,
      `
      new Object;
    `
    );
  });

  it('does not add parentheses in complicated `new` expressions where it would be incorrect', () => {
    check(
      `
      new A().B
    `,
      `
      new A().B;
    `
    );
  });

  it('inserts missing parentheses before an implicit object brace', () => {
    check(
      `
      new A
        a: a
        b: b
    `,
      `
      new A({
        a,
        b
      });
    `
    );
  });

  it('defines proper bounds for new operators', () => {
    check(
      `
      new Construct a, 
        a: [
          'abc'
          'def'
        ]
    `,
      `
      new Construct(a, { 
        a: [
          'abc',
          'def'
        ]
      });
    `
    );
  });

  it('allows `new` on regular functions', () => {
    check(
      `
      new -> a
    `,
      `
      (new (function() { return a; }));
    `
    );
  });

  it('allows `new` on bound functions', () => {
    // Note that the resulting code crashes when run, which is a documented
    // correctness issue in decaffeinate.
    check(
      `
      new => a
    `,
      `
      new (() => a);
    `
    );
  });

  it('wraps parens around an IIFE `try` used with `new`', () => {
    check(
      `
      new try Array
    `,
      `
      new ((() => { try { return Array; } catch (error) {} })());
    `
    );
  });

  it('wraps parens around a `do` used with `new`', () => {
    check(
      `
      new do -> ->
    `,
      `
      new ((() => function() {})());
    `
    );
  });
});
