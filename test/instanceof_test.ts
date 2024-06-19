import check from './support/check';

describe('instanceof', () => {
  it('passes through as-is', () => {
    check(`a instanceof b`, `a instanceof b;`);
  });

  it('allows transforming of its children', () => {
    check(`@a instanceof @b`, `this.a instanceof this.b;`);
  });

  it('works with negated `instanceof`', () => {
    check(`a not instanceof b`, `!(a instanceof b);`);
    check(`a ! instanceof b`, `!(a instanceof b);`);
    check(`a !instanceof b`, `!(a instanceof b);`);
  });

  // Ideally we wouldn't have redundant parens here, but it makes the
  // implementation simpler.
  it('handles negated `instanceof` when there are already parens', () => {
    check(`(a not instanceof b)`, `!(a instanceof b);`);
  });

  it('works with double-negated `instanceof`', () => {
    check(
      `
      unless a not instanceof b
        c
    `,
      `
      if (a instanceof b) {
        c;
      }
    `,
    );
  });

  it('works with instanceof that already has parens', () => {
    check(
      `
      if (a not instanceof b)
        c
    `,
      `
      if (!(a instanceof b)) {
        c;
      }
    `,
    );
  });
});
